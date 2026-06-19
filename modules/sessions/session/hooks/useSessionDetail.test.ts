import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSessionDetail } from './useSessionDetail'
import * as sessionsApi from '../api/sessions.api'

vi.mock('../api/sessions.api', () => ({
  getSession: vi.fn(),
  getSessionProgress: vi.fn(),
}))

describe('useSessionDetail', () => {
  beforeEach(() => {
    vi.mocked(sessionsApi.getSession).mockReset()
    vi.mocked(sessionsApi.getSessionProgress).mockReset()
  })

  it('loads session and maps answers by question_id', async () => {
    vi.mocked(sessionsApi.getSession).mockResolvedValue({
      id: 's1',
      name: 'Session 1',
      status: 'in_progress',
      answers: [{ question_id: 'q1', answer_status: 'answered', value: { text: 'hi' } }],
      questions: [],
    } as never)
    vi.mocked(sessionsApi.getSessionProgress).mockResolvedValue({ answered: 1, total: 1 } as never)

    const { result } = renderHook(() => useSessionDetail('org1', 'proj1', 's1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.session?.id).toBe('s1')
    expect(result.current.answers.q1?.question_id).toBe('q1')
  })

  it('does not fetch when ids are missing', async () => {
    const { result } = renderHook(() => useSessionDetail(null, null, null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(sessionsApi.getSession).not.toHaveBeenCalled()
  })
})
