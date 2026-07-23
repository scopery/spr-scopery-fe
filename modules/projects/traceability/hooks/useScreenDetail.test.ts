import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useScreenDetail } from './useScreenDetail'

vi.mock('../api/traceability.api', () => ({
  listScreenSections: vi.fn(async () => ({
    items: [
      {
        id: 'sec1',
        screenId: 's1',
        workspaceId: 'ws1',
        name: 'Main',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  listScreenFields: vi.fn(async () => ({
    items: [
      {
        id: 'f1',
        screenId: 's1',
        workspaceId: 'ws1',
        fieldKey: 'email',
        label: 'Email',
        fieldType: 'TEXT',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  listScreenActions: vi.fn(async () => ({ items: [] })),
  createScreenSection: vi.fn(async () => ({})),
  updateScreenSection: vi.fn(async () => ({})),
  deleteScreenSection: vi.fn(async () => undefined),
  createScreenField: vi.fn(async () => ({})),
  updateScreenField: vi.fn(async () => ({})),
  deleteScreenField: vi.fn(async () => undefined),
  createScreenAction: vi.fn(async () => ({})),
  updateScreenAction: vi.fn(async () => ({})),
  deleteScreenAction: vi.fn(async () => undefined),
}))

import * as api from '../api/traceability.api'

describe('useScreenDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads sections and fields for a screen', async () => {
    const { result } = renderHook(() => useScreenDetail('ws1', 's1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.sections[0].name).toBe('Main')
    expect(result.current.fields[0].fieldKey).toBe('email')
  })

  it('creates a section then reloads', async () => {
    const { result } = renderHook(() => useScreenDetail('ws1', 's1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createSection({ name: 'Sidebar' })
    })

    expect(api.createScreenSection).toHaveBeenCalledWith('ws1', 's1', { name: 'Sidebar' })
    expect(api.listScreenSections).toHaveBeenCalledTimes(2)
  })
})
