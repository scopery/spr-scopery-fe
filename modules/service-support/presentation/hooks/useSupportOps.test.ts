import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ApiError } from '@/shared/lib/api-types'
import { useSupportOps } from './useSupportOps'

vi.mock('../../infrastructure/api/support.api', () => ({
  listIncidents: vi.fn(async () => ({
    items: [{ id: 'inc1', title: 'Outage', status: 'OPEN', severity: 'HIGH' }],
  })),
  listProblems: vi.fn(async () => ({
    items: [{ id: 'pr1', title: 'Root cause', status: 'OPEN' }],
  })),
  listMaintenancePlans: vi.fn(async () => ({ items: [] })),
  acknowledgeIncident: vi.fn(async () => ({ id: 'inc1', status: 'ACKED' })),
  resolveIncident: vi.fn(),
  closeIncident: vi.fn(),
  resolveProblem: vi.fn(),
  closeProblem: vi.fn(),
}))

describe('useSupportOps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads incidents and problems', async () => {
    const { result } = renderHook(() => useSupportOps('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.incidents[0].title).toBe('Outage')
    expect(result.current.problems[0].title).toBe('Root cause')
  })

  it('surfaces 403 on acknowledge', async () => {
    const api = await import('../../infrastructure/api/support.api')
    vi.mocked(api.acknowledgeIncident).mockRejectedValueOnce(
      new ApiError(403, {
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Missing INCIDENT_ACK',
      })
    )
    const { result } = renderHook(() => useSupportOps('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.acknowledgeIncident('inc1')
    })
    expect(result.current.actionError).toBe('Missing INCIDENT_ACK')
  })
})
