import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useScreenModes } from './useScreenModes'

vi.mock('../../infrastructure/api/screen-spec.api', () => ({
  listScreenModes: vi.fn(async () => ({
    items: [
      {
        id: 'm1',
        screenId: 's1',
        modeCode: 'CREATE',
        name: 'Create',
        displayOrder: 1,
        status: 'ACTIVE',
      },
      {
        id: 'm2',
        screenId: 's1',
        modeCode: 'VIEW',
        name: 'View',
        displayOrder: 2,
        status: 'ARCHIVED',
      },
    ],
  })),
  createScreenMode: vi.fn(async () => ({})),
  updateScreenMode: vi.fn(async () => ({})),
  deleteScreenMode: vi.fn(async () => undefined),
}))

import * as api from '../../infrastructure/api/screen-spec.api'

describe('useScreenModes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads modes and exposes only active ones for config', async () => {
    const { result } = renderHook(() => useScreenModes('ws1', 's1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(2)
    expect(result.current.activeModes).toHaveLength(1)
    expect(result.current.activeModes[0].modeCode).toBe('CREATE')
  })

  it('creates a mode then reloads', async () => {
    const { result } = renderHook(() => useScreenModes('ws1', 's1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createMode({ modeCode: 'EDIT', name: 'Edit' })
    })

    expect(api.createScreenMode).toHaveBeenCalledWith('ws1', 's1', {
      modeCode: 'EDIT',
      name: 'Edit',
    })
    expect(api.listScreenModes).toHaveBeenCalledTimes(2)
  })
})
