import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSessionClarity } from './useSessionClarity'
import * as aiClarityApi from '../api/ai-clarity.api'
import { ApiError } from '@/shared/lib/api-types'

vi.mock('../api/ai-clarity.api', () => ({
  getClaritySummary: vi.fn(),
  assessOne: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

vi.mock('@/config/features', () => ({
  FEATURES: { aiClarityAssessment: true },
}))

describe('useSessionClarity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(aiClarityApi.getClaritySummary).mockResolvedValue({ stats: {} } as never)
  })

  it('loads clarity summary when session is ready', async () => {
    const { result } = renderHook(() =>
      useSessionClarity({
        orgId: 'org1',
        projectId: 'p1',
        sessionId: 's1',
        sessionIdReady: true,
        canAssessClarity: true,
        orderedQuestions: [],
        questionOrderMap: {},
        answers: {},
      })
    )

    await waitFor(() => expect(aiClarityApi.getClaritySummary).toHaveBeenCalled())
    expect(result.current.claritySummaryLoading).toBe(false)
  })

  it('disables feature on AI_FEATURE_DISABLED 409', async () => {
    vi.mocked(aiClarityApi.assessOne).mockRejectedValue(
      new ApiError(409, {
        type: 'about:blank',
        title: 'Disabled',
        status: 409,
        detail: 'AI disabled',
        code: 'AI_FEATURE_DISABLED',
      })
    )

    const q = {
      id: 'q1',
      prompt: 'Question?',
      section: 'general',
      q_type: 'text',
      required: true,
    } as never

    const { result } = renderHook(() =>
      useSessionClarity({
        orgId: 'org1',
        projectId: 'p1',
        sessionId: 's1',
        sessionIdReady: true,
        canAssessClarity: true,
        orderedQuestions: [q],
        questionOrderMap: { q1: 1 },
        answers: { q1: { answer_status: 'answered', value: 'yes' } as never },
      })
    )

    await act(async () => {
      await result.current.handleAssessClarity(1, q, {
        answer_status: 'answered',
        value: 'yes',
      } as never)
    })

    await waitFor(() => {
      expect(result.current.featureDisabled).toBe(true)
    })
  })
})
