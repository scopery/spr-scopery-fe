import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePortalReviews } from './usePortalReviews'

vi.mock('../../infrastructure/api/portal.api', () => ({
  listPortalReviews: vi.fn(async () => ({
    items: [{ id: 'r1', projectId: 'p1', title: 'SRS review', status: 'PENDING' }],
  })),
  decidePortalReview: vi.fn(async () => ({
    id: 'r1',
    projectId: 'p1',
    title: 'SRS review',
    status: 'APPROVED',
  })),
}))

describe('usePortalReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads reviews', async () => {
    const { result } = renderHook(() => usePortalReviews('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items[0].title).toBe('SRS review')
  })

  it('decides a review', async () => {
    const api = await import('../../infrastructure/api/portal.api')
    const { result } = renderHook(() => usePortalReviews('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.decide('r1', 'APPROVED')
    })
    expect(api.decidePortalReview).toHaveBeenCalledWith('p1', 'r1', {
      decision: 'APPROVED',
      comment: undefined,
    })
  })
})
