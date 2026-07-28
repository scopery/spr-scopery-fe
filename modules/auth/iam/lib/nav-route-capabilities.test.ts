import { describe, expect, it } from 'vitest'
import { resolveNavCapabilityForPath } from './nav-route-capabilities'
import { NavCapabilityKey } from '../model/nav-capabilities'

const WS = 'ws-1'

describe('resolveNavCapabilityForPath', () => {
  it('gates workspace capacity', () => {
    const req = resolveNavCapabilityForPath(`/workspace/${WS}/capacity`, WS)
    expect(req?.key).toBe(NavCapabilityKey.WorkspaceCapacity)
    expect(req?.fallbackHref).toBe(`/workspace/${WS}/projects`)
  })

  it('gates project financials to project overview', () => {
    const req = resolveNavCapabilityForPath(
      `/workspace/${WS}/projects/p1/financials/scenario-1`,
      WS
    )
    expect(req?.key).toBe(NavCapabilityKey.ProjectFinancials)
    expect(req?.fallbackHref).toBe(`/workspace/${WS}/projects/p1/overview`)
  })

  it('gates org members', () => {
    const req = resolveNavCapabilityForPath(
      `/workspace/${WS}/organization/members`,
      WS
    )
    expect(req?.key).toBe(NavCapabilityKey.OrgDirectoryMembers)
  })

  it('gates org directory', () => {
    const req = resolveNavCapabilityForPath(
      `/workspace/${WS}/organization/directory`,
      WS
    )
    expect(req?.key).toBe(NavCapabilityKey.OrgDirectory)
  })

  it('returns null for unknown nested paths', () => {
    expect(resolveNavCapabilityForPath(`/workspace/${WS}/saved-items`, WS)).toBeNull()
  })
})
