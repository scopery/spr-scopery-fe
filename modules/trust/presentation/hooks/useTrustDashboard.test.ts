import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTrustDashboard } from './useTrustDashboard'

vi.mock('../../infrastructure/api/trust.api', () => ({
  getTrustDashboard: vi.fn(async () => ({
    openPrivacyRequests: 1,
    activeLegalHolds: 0,
    pendingAccessReviews: 0,
  })),
  listRetentionPolicies: vi.fn(async () => ({
    items: [{ id: 'ret1', policyCode: 'STD', name: 'Standard', retentionPeriodDays: 365 }],
  })),
  listAccessReviewCampaigns: vi.fn(async () => ({ items: [] })),
  listPermissionFindings: vi.fn(async () => ({ items: [] })),
  listEvidenceRecords: vi.fn(async () => ({ items: [] })),
  getClassificationPolicy: vi.fn(async () => ({ defaultLevel: 'CONFIDENTIAL' })),
  listSensitiveObjects: vi.fn(async () => ({ items: [] })),
  listConsentRecords: vi.fn(async () => ({ items: [] })),
  listContactSuppressions: vi.fn(async () => ({ items: [] })),
  listExportAuditLogs: vi.fn(async () => ({ items: [] })),
  listPrivacyExportPackages: vi.fn(async () => ({ items: [] })),
  listRetentionJobs: vi.fn(async () => ({ items: [] })),
  dryRunRetentionPolicy: vi.fn(async () => ({
    policyId: 'ret1',
    status: 'OK',
    blockedByLegalHold: false,
  })),
  startAccessReview: vi.fn(),
  completeAccessReview: vi.fn(),
  cancelAccessReview: vi.fn(),
  resolveFinding: vi.fn(),
  dismissFinding: vi.fn(),
  finalizeEvidence: vi.fn(),
  withdrawConsent: vi.fn(),
  releaseSuppression: vi.fn(),
}))

describe('useTrustDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads retention policies', async () => {
    const { result } = renderHook(() => useTrustDashboard('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.retentionPolicies[0].name).toBe('Standard')
    expect(result.current.classificationPolicy?.defaultLevel).toBe('CONFIDENTIAL')
  })

  it('surfaces legal-hold block on retention dry-run', async () => {
    const api = await import('../../infrastructure/api/trust.api')
    vi.mocked(api.dryRunRetentionPolicy).mockResolvedValueOnce({
      policyId: 'ret1',
      status: 'BLOCKED',
      blockedByLegalHold: true,
    })
    const { result } = renderHook(() => useTrustDashboard('ws1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.dryRunRetention('ret1')
    })
    expect(result.current.actionError).toMatch(/legal hold/i)
  })
})
