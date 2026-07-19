import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProjectNotifications } from './useProjectNotifications'

vi.mock('../api/project-notifications.api', () => ({
  listMyProjectSubscriptions: vi.fn(async () => ({
    items: [{ id: 's1', projectId: 'p1', subscriptionType: 'WATCHER', muted: false }],
  })),
  getMyProjectPreferences: vi.fn(async () => ({
    preferences: [
      { eventCode: 'TASK_ASSIGNED', channel: 'EMAIL', enabled: true, muted: false },
    ],
  })),
  subscribeToProject: vi.fn(async () => ({
    id: 's2',
    projectId: 'p1',
    subscriptionType: 'WATCHER',
  })),
  muteProjectSubscription: vi.fn(async () => undefined),
  unmuteProjectSubscription: vi.fn(async () => undefined),
  unsubscribeFromProject: vi.fn(async () => undefined),
  upsertMyProjectPreferences: vi.fn(async (_pid, preferences) => ({ preferences })),
}))

describe('useProjectNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads subscriptions and preferences', async () => {
    const { result } = renderHook(() => useProjectNotifications('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.subscriptions[0].subscriptionType).toBe('WATCHER')
    expect(result.current.preferences[0].eventCode).toBe('TASK_ASSIGNED')
  })

  it('subscribes as watcher', async () => {
    const api = await import('../api/project-notifications.api')
    const { result } = renderHook(() => useProjectNotifications('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.subscribe('WATCHER')
    })
    expect(api.subscribeToProject).toHaveBeenCalledWith('p1', { subscriptionType: 'WATCHER' })
  })
})
