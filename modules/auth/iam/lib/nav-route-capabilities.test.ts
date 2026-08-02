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

  it('gates resource timeline with workspace capacity', () => {
    const req = resolveNavCapabilityForPath(`/workspace/${WS}/resource-timeline`, WS)
    expect(req?.key).toBe(NavCapabilityKey.WorkspaceCapacity)
  })

  it('gates project financials to project overview', () => {
    const req = resolveNavCapabilityForPath(
      `/workspace/${WS}/projects/p1/financials/scenario-1`,
      WS
    )
    expect(req?.key).toBe(NavCapabilityKey.ProjectFinancials)
    expect(req?.fallbackHref).toBe(`/workspace/${WS}/projects/p1/overview`)
  })

  it('gates the project dashboard to project overview', () => {
    const req = resolveNavCapabilityForPath(`/workspace/${WS}/projects/p1/dashboard`, WS)
    expect(req?.key).toBe(NavCapabilityKey.ProjectDashboard)
    expect(req?.fallbackHref).toBe(`/workspace/${WS}/projects/p1/overview`)
  })

  it('gates Quality catalog routes with the test-plans capability', () => {
    const testCases = resolveNavCapabilityForPath(
      `/workspace/${WS}/projects/p1/quality/test-cases`,
      WS
    )
    const verificationCases = resolveNavCapabilityForPath(
      `/workspace/${WS}/projects/p1/quality/verification-cases`,
      WS
    )
    const testRuns = resolveNavCapabilityForPath(
      `/workspace/${WS}/projects/p1/quality/test-runs`,
      WS
    )
    const cases = resolveNavCapabilityForPath(`/workspace/${WS}/projects/p1/quality/cases`, WS)
    const runs = resolveNavCapabilityForPath(`/workspace/${WS}/projects/p1/quality/runs`, WS)
    const qualityDefects = resolveNavCapabilityForPath(
      `/workspace/${WS}/projects/p1/quality/defects`,
      WS
    )
    const qualityReleases = resolveNavCapabilityForPath(
      `/workspace/${WS}/projects/p1/quality/releases`,
      WS
    )

    expect(testCases?.key).toBe(NavCapabilityKey.ProjectTestPlans)
    expect(verificationCases?.key).toBe(NavCapabilityKey.ProjectTestPlans)
    expect(testRuns?.key).toBe(NavCapabilityKey.ProjectTestPlans)
    expect(cases?.key).toBe(NavCapabilityKey.ProjectTestPlans)
    expect(runs?.key).toBe(NavCapabilityKey.ProjectTestPlans)
    expect(qualityDefects?.key).toBe(NavCapabilityKey.ProjectDefects)
    expect(qualityReleases?.key).toBe(NavCapabilityKey.ProjectReleases)
    const fallbackCapabilities = [
      NavCapabilityKey.ProjectQuality,
      NavCapabilityKey.ProjectScope,
      NavCapabilityKey.ProjectRequirements,
      NavCapabilityKey.ProjectRaid,
    ]
    expect(testCases?.alternativeKeys).toEqual(fallbackCapabilities)
    expect(verificationCases?.alternativeKeys).toEqual(fallbackCapabilities)
    expect(testRuns?.alternativeKeys).toEqual(fallbackCapabilities)
    expect(cases?.alternativeKeys).toEqual(fallbackCapabilities)
    expect(runs?.alternativeKeys).toEqual(fallbackCapabilities)
    expect(testCases?.fallbackHref).toBe(`/workspace/${WS}/projects/p1/overview`)
  })

  it('keeps the Quality overview on the parent capability', () => {
    const req = resolveNavCapabilityForPath(`/workspace/${WS}/projects/p1/quality`, WS)
    expect(req?.key).toBe(NavCapabilityKey.ProjectQuality)
  })

  it('gates org members', () => {
    const req = resolveNavCapabilityForPath(`/workspace/${WS}/organization/members`, WS)
    expect(req?.key).toBe(NavCapabilityKey.OrgDirectoryMembers)
  })

  it('gates org directory', () => {
    const req = resolveNavCapabilityForPath(`/workspace/${WS}/organization/directory`, WS)
    expect(req?.key).toBe(NavCapabilityKey.OrgDirectory)
  })

  it('returns null for unknown nested paths', () => {
    expect(resolveNavCapabilityForPath(`/workspace/${WS}/saved-items`, WS)).toBeNull()
  })
})
