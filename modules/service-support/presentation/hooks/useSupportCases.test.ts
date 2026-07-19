import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSupportCaseDetail } from './useSupportCases'

vi.mock('../../infrastructure/api/support.api', () => ({
  getSupportCase: vi.fn(async () => ({
    id: 'c1',
    workspaceId: 'ws1',
    title: 'Login broken',
    status: 'NEW',
    priority: 'HIGH',
  })),
  listCaseComments: vi.fn(async () => ({ items: [] })),
  triageSupportCase: vi.fn(async () => ({
    id: 'c1',
    workspaceId: 'ws1',
    title: 'Login broken',
    status: 'TRIAGED',
  })),
  resolveSupportCase: vi.fn(async () => ({
    id: 'c1',
    workspaceId: 'ws1',
    title: 'Login broken',
    status: 'RESOLVED',
  })),
  closeSupportCase: vi.fn(async () => ({
    id: 'c1',
    workspaceId: 'ws1',
    title: 'Login broken',
    status: 'CLOSED',
  })),
  addCaseComment: vi.fn(async () => ({ id: 'cm1', body: 'Looking into it' })),
}))

describe('useSupportCaseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads case detail', async () => {
    const { result } = renderHook(() => useSupportCaseDetail('ws1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.item?.title).toBe('Login broken')
  })

  it('resolves then closes via API', async () => {
    const api = await import('../../infrastructure/api/support.api')
    const { result } = renderHook(() => useSupportCaseDetail('ws1', 'c1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.resolve()
    })
    expect(api.resolveSupportCase).toHaveBeenCalledWith('ws1', 'c1')
    await act(async () => {
      await result.current.close()
    })
    expect(api.closeSupportCase).toHaveBeenCalledWith('ws1', 'c1')
  })
})
