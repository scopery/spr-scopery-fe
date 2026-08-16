import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useScreenProcessItems } from './useScreenNarrativeItems'

vi.mock('../../infrastructure/api/screen-spec.api', () => ({
  listProcessItems: vi.fn(async () => ({
    items: [
      {
        id: 'p1',
        title: 'Init',
        content: 'Load',
        modeId: null,
        targetFieldId: null,
        sourceTable: null,
        conditionNote: null,
        displayOrder: 0,
      },
      {
        id: 'p2',
        title: 'Save',
        content: 'Persist',
        modeId: null,
        targetFieldId: null,
        sourceTable: null,
        conditionNote: null,
        displayOrder: 1,
      },
    ],
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
    expect(api.createProcessItem).toHaveBeenCalledWith('ws1', 's1', {
      title: 'Save',
      displayOrder: 2,
    })
    expect(api.listProcessItems).toHaveBeenCalledTimes(2)
  })

  it('reorders by putting only changed displayOrder rows', async () => {
    const { result } = renderHook(() => useScreenProcessItems('ws1', 's1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.reorderItems(['p2', 'p1'])
    })

    expect(api.updateProcessItem).toHaveBeenCalledTimes(2)
    expect(api.updateProcessItem).toHaveBeenCalledWith(
      'ws1',
      's1',
      'p2',
      expect.objectContaining({ title: 'Save', content: 'Persist', displayOrder: 0 })
    )
    expect(api.updateProcessItem).toHaveBeenCalledWith(
      'ws1',
      's1',
      'p1',
      expect.objectContaining({ title: 'Init', content: 'Load', displayOrder: 1 })
    )
    expect(result.current.items.map((item) => item.id)).toEqual(['p2', 'p1'])
  })
})
