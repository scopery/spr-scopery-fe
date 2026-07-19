/**
 * SSE client for Wave 4/5 streaming.
 * Uses fetch streaming (not EventSource) so AbortController, credentials,
 * custom headers, and Last-Event-ID reconnect work reliably (W5-GAP-01/02).
 */

export const SseEventType = {
  // Wave 4 legacy names (still accepted)
  MessageStarted: 'message.started',
  MessageDelta: 'message.delta',
  MessageCitation: 'message.citation',
  MessageCompleted: 'message.completed',
  MessageError: 'message.error',
  Heartbeat: 'heartbeat',
  TurnStarted: 'turn.started',
  ContentDelta: 'content.delta',
  CitationAdded: 'citation.added',
  ToolStarted: 'tool.started',
  ToolCompleted: 'tool.completed',
  Warning: 'warning',
  TurnCompleted: 'turn.completed',
  TurnError: 'turn.error',
  // Wave 5 AI Assistant contract
  StatusChanged: 'STATUS_CHANGED',
  Token: 'TOKEN',
  ToolCall: 'TOOL_CALL',
  ToolResult: 'TOOL_RESULT',
  Completed: 'COMPLETED',
  Error: 'ERROR',
} as const

export type SseEventType = (typeof SseEventType)[keyof typeof SseEventType]

/** Terminal events — stream should not reconnect after these. */
export const SSE_TERMINAL_EVENTS = new Set<string>([
  SseEventType.Completed,
  SseEventType.Error,
  SseEventType.MessageCompleted,
  SseEventType.MessageError,
  SseEventType.TurnCompleted,
  SseEventType.TurnError,
])

export interface SseParsedEvent {
  id?: string
  event: string
  data: string
  retry?: number
}

export interface SseClientOptions {
  url: string
  method?: 'GET' | 'POST'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Called for each parsed SSE event. */
  onEvent: (event: SseParsedEvent) => void
  onError?: (error: unknown) => void
  onDone?: () => void
  /** Fired when a reconnect attempt starts (after first successful connection drop). */
  onReconnect?: (attempt: number, lastEventId: string | null) => void
  /** Seed Last-Event-ID before the first request (resume after remount). */
  initialLastEventId?: string | null
  /** Max reconnect attempts after network drop (default 3). */
  maxReconnects?: number
  reconnectDelayMs?: number
}

export function parseSseChunk(buffer: string): { events: SseParsedEvent[]; rest: string } {
  const events: SseParsedEvent[] = []
  const parts = buffer.split(/\n\n/)
  const rest = parts.pop() ?? ''

  for (const part of parts) {
    if (!part.trim()) continue
    // Heartbeat comments (`: heartbeat`) — expose as synthetic heartbeat event
    if (part.startsWith(':')) {
      events.push({ event: SseEventType.Heartbeat, data: part.slice(1).trim() })
      continue
    }
    let id: string | undefined
    let event = 'message'
    let data = ''
    let retry: number | undefined

    for (const line of part.split('\n')) {
      if (line.startsWith('id:')) id = line.slice(3).trim()
      else if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) {
        data += (data ? '\n' : '') + line.slice(5).trimStart()
      } else if (line.startsWith('retry:')) {
        const n = Number(line.slice(6).trim())
        if (!Number.isNaN(n)) retry = n
      }
    }
    events.push({ id, event, data, retry })
  }

  return { events, rest }
}

/**
 * Open an SSE stream. Returns a cancel function.
 * Caller owns the AbortController if passed via `signal`.
 *
 * On mid-stream disconnect (before a terminal event), reconnects with
 * `Last-Event-ID` set to the last received event id (W5 contract Redis replay).
 */
export function openSseStream(options: SseClientOptions): { cancel: () => void } {
  const controller = new AbortController()
  const external = options.signal
  const onAbort = () => controller.abort()
  if (external) {
    if (external.aborted) controller.abort()
    else external.addEventListener('abort', onAbort, { once: true })
  }

  let cancelled = false
  let reconnects = 0
  let lastEventId: string | null = options.initialLastEventId ?? null
  let sawTerminal = false
  const maxReconnects = options.maxReconnects ?? 3
  const reconnectDelayMs = options.reconnectDelayMs ?? 1000

  const run = async () => {
    while (!cancelled && !controller.signal.aborted) {
      try {
        if (reconnects > 0) {
          options.onReconnect?.(reconnects, lastEventId)
        }

        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          ...(options.headers ?? {}),
        }
        if (lastEventId) {
          headers['Last-Event-ID'] = lastEventId
        }

        const method = options.method ?? 'GET'
        if (method !== 'GET' && options.body !== undefined) {
          headers['Content-Type'] = 'application/json'
        }

        const res = await fetch(options.url, {
          method,
          credentials: 'include',
          headers,
          body:
            method !== 'GET' && options.body !== undefined
              ? JSON.stringify(options.body)
              : undefined,
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error(`SSE request failed: HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const { events, rest } = parseSseChunk(buffer)
          buffer = rest
          for (const ev of events) {
            if (ev.id) lastEventId = ev.id
            if (SSE_TERMINAL_EVENTS.has(ev.event)) sawTerminal = true
            options.onEvent(ev)
          }
        }

        if (sawTerminal || cancelled) {
          options.onDone?.()
          return
        }

        // Stream ended without terminal event — attempt reconnect
        if (reconnects >= maxReconnects) {
          options.onError?.(new Error('SSE stream ended before terminal event'))
          options.onDone?.()
          return
        }
        reconnects += 1
        await new Promise((r) => setTimeout(r, reconnectDelayMs * reconnects))
      } catch (err) {
        if (cancelled || controller.signal.aborted) return
        if (sawTerminal) {
          options.onDone?.()
          return
        }
        options.onError?.(err)
        if (reconnects >= maxReconnects) {
          options.onDone?.()
          return
        }
        reconnects += 1
        await new Promise((r) => setTimeout(r, reconnectDelayMs * reconnects))
      }
    }
  }

  void run()

  return {
    cancel: () => {
      cancelled = true
      controller.abort()
      if (external) external.removeEventListener('abort', onAbort)
    },
  }
}

export const sseClient = {
  open: openSseStream,
}
