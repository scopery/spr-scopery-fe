import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ApiError } from '@/shared/lib/api-types'
import { useAiRecommendations } from './useAiRecommendations'

vi.mock('../../infrastructure/api/ai-recommendation.api', () => ({
  listRecommendations: vi.fn(async () => ({
    items: [
      {
        id: 'sys:1',
        suggestionRef: 'sys:1',
        title: 'Add milestone',
        status: 'NEW',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  acceptRecommendation: vi.fn(async () => ({
    id: 'sys:1',
    title: 'Add milestone',
    status: 'ACCEPTED',
    createdAt: '2026-01-01T00:00:00Z',
  })),
  rejectRecommendation: vi.fn(async () => ({
    id: 'sys:1',
    title: 'Add milestone',
    status: 'REJECTED',
    createdAt: '2026-01-01T00:00:00Z',
  })),
  prepareApplyRecommendation: vi.fn(async () => ({
    suggestionRef: 'sys:1',
    ready: true,
  })),
}))

describe('useAiRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads recommendations', async () => {
    const { result } = renderHook(() => useAiRecommendations('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items[0].title).toBe('Add milestone')
  })

  it('accepts a recommendation', async () => {
    const api = await import('../../infrastructure/api/ai-recommendation.api')
    const { result } = renderHook(() => useAiRecommendations('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.accept(result.current.items[0])
    })
    expect(api.acceptRecommendation).toHaveBeenCalledWith('sys:1')
  })

  it('surfaces 403 as action error on reject', async () => {
    const api = await import('../../infrastructure/api/ai-recommendation.api')
    vi.mocked(api.rejectRecommendation).mockRejectedValueOnce(
      new ApiError(403, {
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Missing PROJECT_EDIT',
      })
    )
    const { result } = renderHook(() => useAiRecommendations('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.reject(result.current.items[0])
    })
    expect(result.current.actionError).toBe('Missing PROJECT_EDIT')
  })
})
