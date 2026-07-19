import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProjectGovernance } from './useProjectGovernance'

vi.mock('../api/project-governance.api', () => ({
  listProjectOwnership: vi.fn(async () => ({
    items: [
      {
        objectTypeCode: 'DOCUMENT',
        targetId: 'doc-1',
        ownerDisplayName: 'Alex',
      },
    ],
  })),
  listLockedObjects: vi.fn(async () => ({
    items: [{ id: 'lock-1', objectTypeCode: 'DOCUMENT', targetId: 'doc-1' }],
  })),
  getGovernancePack: vi.fn(async () => ({
    ownershipCount: 1,
    lockCount: 1,
    grantCount: 0,
  })),
  listGovernanceObjectTypes: vi.fn(async () => ({ items: [] })),
  listAccessGrants: vi.fn(async () => ({
    items: [{ id: 'g1', objectTypeCode: 'DOCUMENT', targetId: 'doc-1', grantRole: 'REVIEWER' }],
  })),
  listGovernanceVersions: vi.fn(async () => ({
    items: [{ id: 'v1', versionNumber: 1 }],
  })),
  releaseLock: vi.fn(async () => undefined),
  finalizeObject: vi.fn(async () => undefined),
  revokeAccessGrant: vi.fn(async () => undefined),
  checkBaselineGuard: vi.fn(async () => ({ allowed: true })),
}))

describe('useProjectGovernance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads ownership and locks', async () => {
    const { result } = renderHook(() => useProjectGovernance('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.ownership).toHaveLength(1)
    expect(result.current.locks).toHaveLength(1)
  })

  it('loads inspector data for a selected object', async () => {
    const { result } = renderHook(() => useProjectGovernance('p1'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.selectObject('DOCUMENT', 'doc-1')
    })
    expect(result.current.grants[0].grantRole).toBe('REVIEWER')
    expect(result.current.versions).toHaveLength(1)
  })
})
