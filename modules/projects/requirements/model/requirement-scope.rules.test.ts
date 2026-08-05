import { describe, expect, it } from 'vitest'
import type { Requirement } from './requirements'
import {
  isRequirementLinkableToScope,
  isRequirementUnscoped,
  matchesRequirementScopeFilter,
} from './requirement-scope.rules'

function req(partial: Partial<Requirement> & Pick<Requirement, 'id' | 'code' | 'title'>): Requirement {
  return {
    project_id: 'p1',
    parent_id: null,
    description: null,
    created_at: '2026-01-01',
    status: 'DRAFT',
    ...partial,
  }
}

describe('requirement-scope.rules', () => {
  it('treats missing scope ids as unscoped', () => {
    expect(isRequirementUnscoped(req({ id: '1', code: 'R1', title: 'A' }))).toBe(true)
  })

  it('only active unscoped are linkable', () => {
    expect(
      isRequirementLinkableToScope(
        req({ id: '1', code: 'R1', title: 'A', scopePackageId: 'sp1' })
      )
    ).toBe(false)
    expect(
      isRequirementLinkableToScope(
        req({ id: '2', code: 'R2', title: 'B', status: 'ARCHIVED' })
      )
    ).toBe(false)
    expect(isRequirementLinkableToScope(req({ id: '3', code: 'R3', title: 'C' }))).toBe(
      true
    )
  })

  it('filters by package id', () => {
    const r = req({ id: '1', code: 'R1', title: 'A', scopePackageId: 'sp1' })
    expect(matchesRequirementScopeFilter(r, 'all')).toBe(true)
    expect(matchesRequirementScopeFilter(r, 'unscoped')).toBe(false)
    expect(matchesRequirementScopeFilter(r, 'sp1')).toBe(true)
    expect(matchesRequirementScopeFilter(r, 'sp2')).toBe(false)
  })
})
