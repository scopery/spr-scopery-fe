import { describe, expect, it } from 'vitest'
import { AiStreamUiState } from '@/modules/ai-assistant/domain/enums/ai-assistant.enum'
import {
  applyCompleted,
  applyReconnect,
  applyStatusChanged,
  applyToken,
  applyToolCall,
  applyToolResult,
  createInitialStreamState,
  markEventSeen,
  shouldIgnoreDuplicateEvent,
} from '@/modules/ai-assistant/presentation/hooks/aiMessageStream.reducer'

describe('aiMessageStream.reducer (W5-C)', () => {
  it('deduplicates SSE event ids', () => {
    let state = createInitialStreamState()
    state = markEventSeen(state, '10')
    expect(shouldIgnoreDuplicateEvent(state, '10')).toBe(true)
    expect(shouldIgnoreDuplicateEvent(state, '11')).toBe(false)
  })

  it('appends tokens and tracks STATUS_CHANGED → CANCELLING', () => {
    let state = createInitialStreamState()
    state = applyToken(state, 'Hello')
    state = applyToken(state, ' world')
    expect(state.streamingText).toBe('Hello world')
    state = applyStatusChanged(state, 'CANCEL_REQUESTED')
    expect(state.uiState).toBe(AiStreamUiState.Cancelling)
  })

  it('masks secrets in tool input summary', () => {
    let state = createInitialStreamState()
    state = applyToolCall(state, {
      toolName: 'knowledge.search',
      toolCallId: 't1',
      input: { api_key: 'super-secret', q: 'scope' },
    })
    expect(state.tools[0]?.inputSummary).toContain('***')
    expect(state.tools[0]?.inputSummary).not.toContain('super-secret')

    state = applyToolResult(state, {
      toolCallId: 't1',
      toolName: 'knowledge.search',
      result: { hits: 2 },
      durationMs: 12,
    })
    expect(state.tools[0]?.status).toBe('completed')
    expect(state.tools[0]?.durationMs).toBe(12)
  })

  it('marks completed and reconnecting states', () => {
    let state = applyToken(createInitialStreamState(), 'x')
    state = applyReconnect(state)
    expect(state.uiState).toBe(AiStreamUiState.Reconnecting)
    expect(state.streamingText).toBe('x')
    state = applyCompleted(state)
    expect(state.uiState).toBe(AiStreamUiState.Completed)
  })
})
