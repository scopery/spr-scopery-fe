import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useFunctionalCatalog } from './useFunctionalCatalog'

vi.mock('../api/functional-catalog.api', () => ({
  listFunctionalItems: vi.fn(async () => ({
    items: [
      {
        id: 'fr1',
        projectId: 'p1',
        workspaceId: 'ws1',
        code: 'FR-CART-01',
        title: 'Add to cart',
        priority: 'HIGH',
        status: 'DRAFT',
        type: 'FUNCTIONAL',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
  listNonFunctionalItems: vi.fn(async () => ({ items: [] })),
  createFunctionalItem: vi.fn(async () => ({})),
  updateFunctionalItem: vi.fn(async () => ({})),
  deleteFunctionalItem: vi.fn(async () => undefined),
  createNonFunctionalItem: vi.fn(async () => ({})),
  updateNonFunctionalItem: vi.fn(async () => ({})),
  deleteNonFunctionalItem: vi.fn(async () => undefined),
}))

import * as api from '../api/functional-catalog.api'

describe('useFunctionalCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads functional and non-functional items', async () => {
    const { result } = renderHook(() => useFunctionalCatalog('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.functionalItems[0].code).toBe('FR-CART-01')
  })

  it('creates a functional item then reloads', async () => {
    const { result } = renderHook(() => useFunctionalCatalog('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createFr({
        code: 'FR-2',
        title: 'Checkout',
        priority: 'MEDIUM',
        type: 'FUNCTIONAL',
        workspaceId: 'ws1',
      })
    })

    expect(api.createFunctionalItem).toHaveBeenCalled()
    expect(api.listFunctionalItems).toHaveBeenCalledTimes(2)
  })

  it('can create without refreshing the list', async () => {
    const { result } = renderHook(() => useFunctionalCatalog('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.createFr(
        {
          code: 'FR-3',
          title: 'Pay',
          priority: 'MEDIUM',
          type: 'FUNCTIONAL',
          workspaceId: 'ws1',
        },
        { refresh: false }
      )
    })

    expect(api.createFunctionalItem).toHaveBeenCalled()
    expect(api.listFunctionalItems).toHaveBeenCalledTimes(1)
  })
})
