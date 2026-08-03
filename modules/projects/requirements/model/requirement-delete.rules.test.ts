import { describe, expect, it } from 'vitest'
import {
  canArchiveRequirement,
  isRequirementLinkedToFunction,
} from './requirement-delete.rules'
import type { Requirement } from './requirements'

function req(partial: Partial<Requirement> = {}): Requirement {
  return {
    id: 'r1',
    project_id: 'p1',
    code: 'REQ-1',
    title: 'Login',
    parent_id: null,
    description: null,
    created_at: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('requirement-delete.rules', () => {
  it('blocks archive when linked to a function', () => {
    const linked = req({ functionalItemId: 'fr-1' })
    expect(isRequirementLinkedToFunction(linked)).toBe(true)
    expect(canArchiveRequirement(linked)).toBe(false)
  })

  it('allows archive when not linked to a function', () => {
    const free = req({ functionalItemId: null, nonFunctionalItemId: 'nfr-1' })
    expect(isRequirementLinkedToFunction(free)).toBe(false)
    expect(canArchiveRequirement(free)).toBe(true)
  })

  it('treats blank functionalItemId as unlinked', () => {
    expect(canArchiveRequirement(req({ functionalItemId: '  ' }))).toBe(true)
  })
})
