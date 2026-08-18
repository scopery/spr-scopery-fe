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
  // Wave 5 AI Assistant BE contract
  'answer.completed',
  'answer.failed',
  'answer.cancelled',
])

export const SSE_TOKEN_EVENTS = new Set<string>([
  SseEventType.Token,
  SseEventType.MessageDelta,
  SseEventType.ContentDelta,
  'answer.delta',
])

export const SSE_FAILED_EVENTS = new Set<string>([
  SseEventType.Error,
  SseEventType.MessageError,
  SseEventType.TurnError,
  'answer.failed',
])

export const SSE_COMPLETED_EVENTS = new Set<string>([
  SseEventType.Completed,
  SseEventType.MessageCompleted,
  SseEventType.TurnCompleted,
  'answer.completed',
])

export function isSseTokenEvent(event: string): boolean {
  return SSE_TOKEN_EVENTS.has(event)
}

export function isSseFailedEvent(event: string): boolean {
  return SSE_FAILED_EVENTS.has(event)
}

export function isSseCompletedEvent(event: string): boolean {
  return SSE_COMPLETED_EVENTS.has(event)
}

const SSE_TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELLED', 'BLOCKED'])

/** STATUS_CHANGED with a finished status is terminal even without a COMPLETED frame. */
export function isSseTerminalStatus(status: string | null | undefined): boolean {
  if (!status) return false
  return SSE_TERMINAL_STATUSES.has(status.trim().toUpperCase())
}

export function isSseTerminalEvent(event: string, data?: string): boolean {
  if (SSE_TERMINAL_EVENTS.has(event)) return true
  if (event !== SseEventType.StatusChanged) return false
  const parsed = parseSseJson(data ?? '')
  if (!isRecord(parsed) || typeof parsed.status !== 'string') return false
  return isSseTerminalStatus(parsed.status)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Parse SSE `data:` JSON. Spring `SseEmitter.event().data(preSerializedJson)`
 * often double-encodes, so a first parse may yield another JSON string.
 */
export function parseSseJson(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    let value: unknown = JSON.parse(trimmed)
    if (typeof value === 'string') {
      const inner = value.trim()
      if (inner.startsWith('{') || inner.startsWith('[') || inner.startsWith('"')) {
        try {
          value = JSON.parse(inner)
        } catch {
          return value
        }
      }
    }
    return value
  } catch {
    return null
  }
}

function coerceDeltaString(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (!isRecord(value)) return null
  if (typeof value.content === 'string') return value.content
  if (typeof value.text === 'string') return value.text
  if (typeof value.delta === 'string') return value.delta
  if (typeof value.token === 'string') return value.token
  if (typeof value.chunk === 'string') return value.chunk
  return null
}

/**
 * Extract the visible token from an SSE payload.
 * BE `answer.delta` sends `{ delta }`; Phase 42 contract uses `{ text }`.
 * Never returns the raw JSON envelope — that was dumping garbage into chat/rewrite.
 */
export function extractSseTextDelta(raw: string): string {
  const parsed = parseSseJson(raw)
  if (parsed == null) return raw
  if (typeof parsed === 'string') return parsed
  if (!isRecord(parsed)) return ''
  const candidates = [parsed.token, parsed.delta, parsed.text, parsed.content, parsed.chunk]
  for (const candidate of candidates) {
    const text = coerceDeltaString(candidate)
    if (text != null) return text
  }
  return ''
}

/** Prefer the SSE `event:` field; fall back to type fields inside JSON. */
export function resolveSseEventName(event: SseParsedEvent): string {
  if (event.event && event.event !== 'message') return event.event
  const parsed = parseSseJson(event.data)
  if (!isRecord(parsed)) return event.event
  const named = parsed.event ?? parsed.eventType ?? parsed.type
  return typeof named === 'string' && named ? named : event.event
}

/**
 * Keep SSE on the same origin as REST (`/api/v1/...`).
 * Other AI calls work because the browser hits scopeary.com/api/* and Next
 * rewrites with cookies. Do not send the browser to the BE host (bad TLS),
 * and do not use `/api/sse` (that BFF is a different auth path → 401).
 */
export function resolveSseUrl(streamUrl: string): string {
  let path = streamUrl.trim()
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path)
      path = `${parsed.pathname}${parsed.search}`
    } catch {
      return path
    }
  }
  if (!path.startsWith('/')) path = `/${path}`
  if (path.startsWith('/api/sse/')) return `/api/${path.slice('/api/sse/'.length)}`
  return path
}

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
  const parts = buffer.split(/\r?\n\r?\n/)
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

    for (const line of part.split(/\r?\n/)) {
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
        if (lastEventId && lastEventId !== '0') {
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

        const dispatch = (ev: SseParsedEvent) => {
          const resolved: SseParsedEvent = { ...ev, event: resolveSseEventName(ev) }
          if (resolved.id) lastEventId = resolved.id
          if (isSseTerminalEvent(resolved.event, resolved.data)) sawTerminal = true
          options.onEvent(resolved)
        }

        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) {
            buffer += decoder.decode()
            if (buffer.trim()) {
              const { events } = parseSseChunk(buffer.endsWith('\n\n') ? buffer : `${buffer}\n\n`)
              events.forEach(dispatch)
            }
            break
          }
          buffer += decoder.decode(value, { stream: true })
          const { events, rest } = parseSseChunk(buffer)
          buffer = rest
          events.forEach(dispatch)
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
        if (reconnects >= maxReconnects) {
          options.onError?.(err)
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
