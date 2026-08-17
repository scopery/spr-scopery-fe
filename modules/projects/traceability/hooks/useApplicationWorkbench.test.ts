import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useApplicationWorkbench } from './useApplicationWorkbench'

vi.mock('../api/traceability.api', () => ({
  getApplication: vi.fn(async () => ({
    id: 'app1',
    workspaceId: 'ws1',
    code: 'CRM',
    name: 'CRM App',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  })),
  listAppModules: vi.fn(async () => ({
    items: [
      {
        id: 'm1',
        applicationId: 'app1',
        workspaceId: 'ws1',
        code: 'AUTH',
        name: 'Auth',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  listScreens: vi.fn(async () => ({
    items: [
      {
        id: 's1',
        applicationId: 'app1',
        code: 'LOGIN',
        name: 'Login',
        routePath: '/login',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  listApiEndpoints: vi.fn(async () => ({
    items: [
      {
        id: 'e1',
        applicationId: 'app1',
        method: 'GET',
        pathPattern: '/users',
        name: 'List users',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  listAppComponents: vi.fn(async () => ({ items: [] })),
  listDataEntities: vi.fn(async () => ({ items: [] })),
  listCommunicationSpecs: vi.fn(async () => ({ items: [] })),
  updateApplication: vi.fn(async () => ({})),
  createAppModule: vi.fn(async () => ({})),
  updateAppModule: vi.fn(async () => ({})),
  deleteAppModule: vi.fn(async () => undefined),
  createScreen: vi.fn(async () => ({})),
  updateScreen: vi.fn(async () => ({})),
  deleteScreen: vi.fn(async () => undefined),
  createApiEndpoint: vi.fn(async () => ({})),
  updateApiEndpoint: vi.fn(async () => ({})),
  deleteApiEndpoint: vi.fn(async () => undefined),
  createAppComponent: vi.fn(async () => ({})),
  updateAppComponent: vi.fn(async () => ({})),
  deleteAppComponent: vi.fn(async () => undefined),
  createDataEntity: vi.fn(async () => ({})),
  updateDataEntity: vi.fn(async () => ({})),
  deleteDataEntity: vi.fn(async () => undefined),
  createCommunicationSpec: vi.fn(async () => ({})),
  updateCommunicationSpec: vi.fn(async () => ({})),
  archiveCommunicationSpec: vi.fn(async () => undefined),
}))

import * as api from '../api/traceability.api'

describe('useApplicationWorkbench', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads application architecture resources', async () => {
    const { result } = renderHook(() => useApplicationWorkbench('ws1', 'app1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.application?.code).toBe('CRM')
    expect(result.current.modules[0].code).toBe('AUTH')
    expect(result.current.screens[0].code).toBe('LOGIN')
    expect(result.current.apiEndpoints[0].method).toBe('GET')
  })

  it('creates a module then reloads', async () => {
    const { result } = renderHook(() => useApplicationWorkbench('ws1', 'app1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createModule({ code: 'BILL', name: 'Billing' })
    })

    expect(api.createAppModule).toHaveBeenCalledWith('ws1', 'app1', {
      code: 'BILL',
      name: 'Billing',
    })
    expect(api.getApplication).toHaveBeenCalledTimes(2)
  })

  it('can create without refreshing the list', async () => {
    const { result } = renderHook(() => useApplicationWorkbench('ws1', 'app1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createModule(
        { code: 'BILL', name: 'Billing' },
        { refresh: false }
      )
    })

    expect(api.createAppModule).toHaveBeenCalledTimes(1)
    expect(api.getApplication).toHaveBeenCalledTimes(1)
  })

  it('creates an API endpoint then reloads', async () => {
    const { result } = renderHook(() => useApplicationWorkbench('ws1', 'app1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createEndpoint({
        method: 'POST',
        pathPattern: '/users',
        name: 'Create user',
      })
    })

    expect(api.createApiEndpoint).toHaveBeenCalledWith('ws1', 'app1', {
      method: 'POST',
      pathPattern: '/users',
      name: 'Create user',
    })
  })
})
