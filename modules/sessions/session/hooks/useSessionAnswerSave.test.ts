import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSessionAnswerSave } from './useSessionAnswerSave'
import * as sessionsApi from '../api/sessions.api'
import { ApiError } from '@/shared/lib/api-types'

vi.mock('../api/sessions.api', () => ({
  putAnswers: vi.fn(),
  lockSession: vi.fn(),
  reopenSession: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))

describe('useSessionAnswerSave', () => {
  const setAnswers = vi.fn()
  const refetchSession = vi.fn()
  const refetchProgress = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves answers via putAnswers', async () => {
    vi.mocked(sessionsApi.putAnswers).mockResolvedValue({
      answers: [{ question_id: 'q1', answer_status: 'answered', value: 'hello' }],
    } as never)

    const { result } = renderHook(() =>
      useSessionAnswerSave({
        orgId: 'org1',
        projectId: 'p1',
        sessionId: 's1',
        session: { questions: [{ id: 'q1', q_type: 'text' }] } as never,
        canSaveBase: true,
        canLock: true,
        canReopen: false,
        answers: {},
        setAnswers,
        refetchSession,
        refetchProgress,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    expect(sessionsApi.putAnswers).toHaveBeenCalled()
  })

  it('marks session locked on SESSION_LOCKED 409', async () => {
    vi.mocked(sessionsApi.putAnswers).mockRejectedValue(
      new ApiError(409, {
        type: 'about:blank',
        title: 'Locked',
        status: 409,
        detail: 'Session locked',
        code: 'SESSION_LOCKED',
      })
    )

    const { result } = renderHook(() =>
      useSessionAnswerSave({
        orgId: 'org1',
        projectId: 'p1',
        sessionId: 's1',
        session: { questions: [] } as never,
        canSaveBase: true,
        canLock: true,
        canReopen: false,
        answers: {
          q1: {
            question_id: 'q1',
            answer_status: 'answered',
            value: 'x',
          } as never,
        },
        setAnswers,
        refetchSession,
        refetchProgress,
      })
    )

    await act(async () => {
      await result.current.handleSave()
    })

    await waitFor(() => {
      expect(result.current.canSave).toBe(false)
    })
    expect(refetchSession).toHaveBeenCalled()
  })
})
