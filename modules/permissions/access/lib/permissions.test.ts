import { describe, expect, it } from 'vitest'
import {
  isOrgReadonly,
  canEditProject,
  resolveProjectRole,
  hasPermission,
  PERMISSIONS,
} from './permissions'

describe('permissions helpers', () => {
  it('isOrgReadonly returns true for partner', () => {
    expect(isOrgReadonly('partner')).toBe(true)
    expect(isOrgReadonly('owner')).toBe(false)
    expect(isOrgReadonly('member')).toBe(false)
  })

  it('canEditProject allows editor only', () => {
    expect(canEditProject('editor')).toBe(true)
    expect(canEditProject('viewer')).toBe(false)
  })

  it('resolveProjectRole defaults to viewer', () => {
    expect(resolveProjectRole('editor')).toBe('editor')
    expect(resolveProjectRole(undefined)).toBe('viewer')
    expect(resolveProjectRole(null)).toBe('viewer')
  })

  it('hasPermission checks effective permissions list', () => {
    expect(
      hasPermission(
        { permissions: [PERMISSIONS.PROJECT_VIEW], roles: [] },
        PERMISSIONS.PROJECT_VIEW
      )
    ).toBe(true)
    expect(hasPermission(null, PERMISSIONS.PROJECT_VIEW)).toBe(false)
  })
})
