import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useEventDefinitions } from './useEventDefinitions'

vi.mock('../../infrastructure/api/event-definitions.api', () => ({
  searchEventDefinitions: vi.fn(async () => ({
    items: [
      {
        id: 'e1',
        code: 'TASK_DONE',
        name: 'Task Done',
        sourceSystem: 'SCOPERY',
        eventKey: 'task.done',
        description: null,
        inputSchema: null,
        outputSchema: null,
        status: 'ACTIVE',
        variables: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ],
    page: 0,
    size: 50,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  })),
  listEventDefinitionVariables: vi.fn(async () => []),
  activateEventDefinition: vi.fn(),
  deactivateEventDefinition: vi.fn(),
  deprecateEventDefinition: vi.fn(),
}))

describe('useEventDefinitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads event definitions', async () => {
    const { result } = renderHook(() => useEventDefinitions({ size: 50 }))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items[0].code).toBe('TASK_DONE')
  })
})
