import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'

export interface StreamToolCall {
  id: string
  toolName: string
  inputSummary: string
  status: 'running' | 'completed' | 'failed'
  resultSummary?: string
  durationMs?: number
  rawInput?: unknown
  rawResult?: unknown
}

export interface StreamControllerState {
  uiState: AiStreamUiState
  streamingText: string
  assistantMessageId: string | null
  messageStatus: string | null
  tools: StreamToolCall[]
  lastEventId: string | null
  seenEventIds: Set<string>
  error: string | null
  canRetryConnection: boolean
}

export function createInitialStreamState(): StreamControllerState {
  return {
    uiState: AiStreamUiState.Idle,
    streamingText: '',
    assistantMessageId: null,
    messageStatus: null,
    tools: [],
    lastEventId: null,
    seenEventIds: new Set(),
    error: null,
    canRetryConnection: false,
  }
}

function summarizeJson(value: unknown, max = 160): string {
  try {
    const raw = typeof value === 'string' ? value : JSON.stringify(value)
    if (!raw) return '—'
    const masked = raw.replace(
      /("?(?:api[_-]?key|secret|token|password|authorization)"?\s*[:=]\s*)("?)([^"',}\s]+)("?)/gi,
      '$1$2***$4'
    )
    return masked.length > max ? `${masked.slice(0, max)}…` : masked
  } catch {
    return '—'
  }
}

export function shouldIgnoreDuplicateEvent(
  state: StreamControllerState,
  eventId: string | undefined
): boolean {
  if (!eventId) return false
  return state.seenEventIds.has(eventId)
}

export function markEventSeen(
  state: StreamControllerState,
  eventId: string | undefined
): StreamControllerState {
  if (!eventId) return state
  const seenEventIds = new Set(state.seenEventIds)
  seenEventIds.add(eventId)
  return { ...state, seenEventIds, lastEventId: eventId }
}

export function applyStatusChanged(
  state: StreamControllerState,
  status: string
): StreamControllerState {
  let uiState = state.uiState
  if (status === 'CANCEL_REQUESTED') uiState = AiStreamUiState.Cancelling
  else if (status === 'CANCELLED') uiState = AiStreamUiState.Cancelled
  else if (status === 'FAILED' || status === 'BLOCKED') uiState = AiStreamUiState.Failed
  else if (status === 'COMPLETED') uiState = AiStreamUiState.Completed
  else if (
    status === 'GENERATING' ||
    status === 'STREAMING' ||
    status === 'RETRIEVING' ||
    status === 'CONTEXTUALIZING' ||
    status === 'QUEUED'
  ) {
    if (state.uiState !== AiStreamUiState.Cancelling) {
      uiState = AiStreamUiState.Connected
    }
  }
  return { ...state, messageStatus: status, uiState, canRetryConnection: false }
}

export function applyToken(
  state: StreamControllerState,
  token: string
): StreamControllerState {
  return {
    ...state,
    streamingText: state.streamingText + token,
    uiState:
      state.uiState === AiStreamUiState.Cancelling
        ? AiStreamUiState.Cancelling
        : AiStreamUiState.Connected,
    canRetryConnection: false,
  }
}

export function applyToolCall(
  state: StreamControllerState,
  payload: { toolName?: string; input?: unknown; toolCallId?: string }
): StreamControllerState {
  const id = payload.toolCallId ?? `tool-${state.tools.length + 1}`
  const tools = [
    ...state.tools.filter((t) => t.id !== id),
    {
      id,
      toolName: payload.toolName ?? 'tool',
      inputSummary: summarizeJson(payload.input),
      status: 'running' as const,
      rawInput: payload.input,
    },
  ]
  return { ...state, tools }
}

export function applyToolResult(
  state: StreamControllerState,
  payload: {
    toolName?: string
    result?: unknown
    toolCallId?: string
    durationMs?: number
    error?: string
  }
): StreamControllerState {
  const id = payload.toolCallId
  const tools = state.tools.map((t) => {
    if (id && t.id !== id) return t
    if (!id && t.toolName !== (payload.toolName ?? t.toolName)) return t
    if (t.status === 'completed' || t.status === 'failed') return t
    return {
      ...t,
      toolName: payload.toolName ?? t.toolName,
      status: payload.error ? ('failed' as const) : ('completed' as const),
      resultSummary: payload.error ?? summarizeJson(payload.result),
      durationMs: payload.durationMs,
      rawResult: payload.result,
    }
  })

  // If no matching running tool, append a completed card
  const matched = id
    ? tools.some((t) => t.id === id)
    : state.tools.some((t) => t.toolName === payload.toolName && t.status === 'running')
  if (!matched) {
    tools.push({
      id: id ?? `tool-result-${tools.length + 1}`,
      toolName: payload.toolName ?? 'tool',
      inputSummary: '—',
      status: payload.error ? 'failed' : 'completed',
      resultSummary: payload.error ?? summarizeJson(payload.result),
      durationMs: payload.durationMs,
      rawResult: payload.result,
    })
  }

  return { ...state, tools }
}

export function applyCompleted(state: StreamControllerState): StreamControllerState {
  return {
    ...state,
    uiState: AiStreamUiState.Completed,
    messageStatus: 'COMPLETED',
    canRetryConnection: false,
  }
}

export function applyFailed(
  state: StreamControllerState,
  message: string
): StreamControllerState {
  return {
    ...state,
    uiState: AiStreamUiState.Failed,
    messageStatus: 'FAILED',
    error: message,
    canRetryConnection: false,
  }
}

export function applyCancelled(state: StreamControllerState): StreamControllerState {
  return {
    ...state,
    uiState: AiStreamUiState.Cancelled,
    messageStatus: 'CANCELLED',
    canRetryConnection: false,
  }
}

export function applyReconnect(state: StreamControllerState): StreamControllerState {
  return {
    ...state,
    uiState: AiStreamUiState.Reconnecting,
    canRetryConnection: false,
    error: null,
  }
}

export function applyReconnectExhausted(
  state: StreamControllerState
): StreamControllerState {
  return {
    ...state,
    uiState: AiStreamUiState.Failed,
    canRetryConnection: true,
    error: state.error ?? 'Connection lost. Retry to continue streaming.',
  }
}

export function isTerminalUiState(state: AiStreamUiState): boolean {
  return (
    state === AiStreamUiState.Completed ||
    state === AiStreamUiState.Failed ||
    state === AiStreamUiState.Cancelled ||
    state === AiStreamUiState.Idle
  )
}
