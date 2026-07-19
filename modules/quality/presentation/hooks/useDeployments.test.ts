import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ApiError } from '@/shared/lib/api-types'
import { useDeployments } from './useDeployments'

vi.mock('../../infrastructure/api/quality.api', () => ({
  listDeployments: vi.fn(async () => ({
    items: [{ id: 'd1', title: 'Prod deploy', status: 'PENDING' }],
  })),
  listDeploymentEnvironments: vi.fn(async () => ({ items: [] })),
  listRollbackPlans: vi.fn(async () => ({ items: [] })),
  getQualityReport: vi.fn(async () => ({})),
  startDeployment: vi.fn(async () => ({ id: 'd1', title: 'Prod deploy', status: 'RUNNING' })),
  succeedDeployment: vi.fn(),
  failDeployment: vi.fn(),
  rollbackDeployment: vi.fn(),
  archiveDeploymentEnvironment: vi.fn(),
  approveRollbackPlan: vi.fn(),
}))

describe('useDeployments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads deployments', async () => {
    const { result } = renderHook(() => useDeployments('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items[0].title).toBe('Prod deploy')
  })

  it('surfaces 403 on start', async () => {
    const api = await import('../../infrastructure/api/quality.api')
    vi.mocked(api.startDeployment).mockRejectedValueOnce(
      new ApiError(403, {
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Missing DEPLOY_START',
      })
    )
    const { result } = renderHook(() => useDeployments('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.start('d1')
    })
    expect(result.current.actionError).toBe('Missing DEPLOY_START')
  })
})
