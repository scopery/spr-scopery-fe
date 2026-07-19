import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWorkInbox } from './useWorkInbox'

vi.mock('../../infrastructure/api/productivity.api', () => ({
  listWorkInbox: vi.fn(async () => ({
    items: [
      {
        id: 'i1',
        title: 'Review SRS',
        status: 'UNREAD',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  markWorkInboxRead: vi.fn(async () => undefined),
}))

describe('useWorkInbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads inbox items', async () => {
    const { result } = renderHook(() => useWorkInbox('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].title).toBe('Review SRS')
  })

  it('marks an item read optimistically', async () => {
    const api = await import('../../infrastructure/api/productivity.api')
    const { result } = renderHook(() => useWorkInbox('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.markRead('i1')
    })
    expect(api.markWorkInboxRead).toHaveBeenCalledWith('ws1', 'i1')
    expect(result.current.items[0].status).toBe('READ')
  })
})
