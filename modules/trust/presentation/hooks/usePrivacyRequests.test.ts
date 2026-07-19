import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePrivacyRequests } from './usePrivacyRequests'

vi.mock('../../infrastructure/api/trust.api', () => ({
  listPrivacyRequests: vi.fn(async () => ({
    items: [{ id: 'pr1', subjectLabel: 'User A', type: 'ERASURE', status: 'OPEN' }],
  })),
  listLegalHolds: vi.fn(async () => ({
    items: [{ id: 'h1', status: 'ACTIVE', name: 'Litigation' }],
  })),
  listAnonymizationPlans: vi.fn(async () => ({
    items: [{ id: 'plan1', status: 'READY', name: 'Erase A' }],
  })),
  dryRunAnonymization: vi.fn(async () => ({
    planId: 'plan1',
    status: 'OK',
    blockedByLegalHold: false,
  })),
  executeAnonymization: vi.fn(async () => ({ planId: 'plan1', status: 'COMPLETED' })),
}))

describe('usePrivacyRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads requests and detects active legal holds', async () => {
    const { result } = renderHook(() => usePrivacyRequests('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.hasActiveLegalHold).toBe(true)
  })

  it('blocks dry-run success when legal hold is active', async () => {
    const { result } = renderHook(() => usePrivacyRequests('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.runDryRun()
    })
    expect(result.current.dryRunOk).toBe(false)
    expect(result.current.actionError).toMatch(/legal hold/i)
  })
})
