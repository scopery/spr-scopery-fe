import { describe, expect, it } from 'vitest'
import {
  buildAiAssistantHeaders,
  clearAiAssistantHeaderContext,
  setAiAssistantHeaderContext,
} from '@/shared/lib/aiAssistantHeaders'

describe('aiAssistantHeaders', () => {
  it('builds Actor and Workspace headers from context', () => {
    clearAiAssistantHeaderContext()
    setAiAssistantHeaderContext({
      workspaceId: 'ws-1',
      actorId: 'user-1',
    })
    expect(buildAiAssistantHeaders({ Accept: 'text/event-stream' })).toEqual({
      Accept: 'text/event-stream',
      'X-Workspace-Id': 'ws-1',
      'X-Actor-Id': 'user-1',
    })
    clearAiAssistantHeaderContext()
  })

  it('omits missing ids', () => {
    clearAiAssistantHeaderContext()
    setAiAssistantHeaderContext({ workspaceId: 'ws-1', actorId: null })
    expect(buildAiAssistantHeaders()).toEqual({
      'X-Workspace-Id': 'ws-1',
    })
    clearAiAssistantHeaderContext()
  })
})
