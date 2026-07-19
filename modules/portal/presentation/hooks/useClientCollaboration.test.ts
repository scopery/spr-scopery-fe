import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { ApiError } from '@/shared/lib/api-types'
import { useClientCollaboration } from './useClientCollaboration'

vi.mock('../../infrastructure/api/portal-collab.api', () => ({
  listPortalInvites: vi.fn(async () => ({
    items: [{ id: 'i1', email: 'client@acme.com', status: 'PENDING' }],
  })),
  listPortalPermissionPolicies: vi.fn(async () => ({
    items: [{ id: 'pol1', code: 'CLIENT_VIEW', name: 'Client view' }],
  })),
  listPortalAccessGrants: vi.fn(async () => ({
    items: [{ id: 'g1', portalAccountId: 'acc1', permissionPolicyCode: 'CLIENT_VIEW' }],
  })),
  listClientReviews: vi.fn(async () => ({
    items: [{ id: 'r1', title: 'SRS', status: 'PENDING' }],
  })),
  listClientFeedback: vi.fn(async () => ({ items: [] })),
  listClientComments: vi.fn(async () => ({ items: [] })),
  listPortalAuditLogs: vi.fn(async () => ({ items: [] })),
  createPortalInvite: vi.fn(async () => ({
    id: 'i2',
    email: 'new@acme.com',
    status: 'PENDING',
  })),
  decideClientReview: vi.fn(async () => ({ id: 'r1', status: 'APPROVED' })),
  revokePortalAccessGrant: vi.fn(async () => undefined),
  suspendPortalAccount: vi.fn(async () => undefined),
  deactivatePortalAccount: vi.fn(async () => undefined),
}))

describe('useClientCollaboration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads invites, policies, grants and reviews', async () => {
    const { result } = renderHook(() => useClientCollaboration('ws1', 'p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.invites[0].email).toBe('client@acme.com')
    expect(result.current.policies[0].code).toBe('CLIENT_VIEW')
    expect(result.current.grants[0].portalAccountId).toBe('acc1')
    expect(result.current.reviews[0].title).toBe('SRS')
  })

  it('sends invite via API', async () => {
    const api = await import('../../infrastructure/api/portal-collab.api')
    const { result } = renderHook(() => useClientCollaboration('ws1', 'p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.invite('new@acme.com')
    })
    expect(api.createPortalInvite).toHaveBeenCalledWith('p1', 'new@acme.com')
  })

  it('surfaces 403 on decide review', async () => {
    const api = await import('../../infrastructure/api/portal-collab.api')
    vi.mocked(api.decideClientReview).mockRejectedValueOnce(
      new ApiError(403, {
        type: 'about:blank',
        title: 'Forbidden',
        status: 403,
        detail: 'Missing PORTAL_REVIEW_DECIDE',
      })
    )
    const { result } = renderHook(() => useClientCollaboration('ws1', 'p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.decideReview('r1', 'APPROVED')
    })
    expect(result.current.actionError).toBe('Missing PORTAL_REVIEW_DECIDE')
  })
})
