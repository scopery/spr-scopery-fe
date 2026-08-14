import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useScreenProcessItems } from './useScreenNarrativeItems'

vi.mock('../../infrastructure/api/screen-spec.api', () => ({
  listProcessItems: vi.fn(async () => ({
    items: [{ id: 'p1', title: 'Init', content: 'Load', modeId: null, targetFieldId: null }],
  })),
  createProcessItem: vi.fn(async () => ({})),
  updateProcessItem: vi.fn(async () => ({})),
  deleteProcessItem: vi.fn(async () => undefined),
  listEventItems: vi.fn(async () => ({ items: [] })),
  createEventItem: vi.fn(async () => ({})),
  updateEventItem: vi.fn(async () => ({})),
  deleteEventItem: vi.fn(async () => undefined),
}))

import * as api from '../../infrastructure/api/screen-spec.api'

describe('useScreenProcessItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads process items then creates another', async () => {
    const { result } = renderHook(() => useScreenProcessItems('ws1', 's1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items[0].title).toBe('Init')

    await act(async () => {
      await result.current.createItem({ title: 'Save' })
    })
    expect(api.createProcessItem).toHaveBeenCalledWith('ws1', 's1', { title: 'Save' })
    expect(api.listProcessItems).toHaveBeenCalledTimes(2)
  })
})
