import { describe, expect, it } from 'vitest'
import type { ArchitectureCatalogNode } from './architecture-workbench'
import type { StructureRelation } from './structure-relation'
import { StructureRelationType } from './structure-relation'
import {
  buildBulkPlan,
  isDuplicateRelation,
  partitionRelationsForFocus,
  validateLink,
} from './structure-relation.rules'

const screen: ArchitectureCatalogNode = {
  id: 's1',
  type: 'SCREEN',
  code: 'SCR_LOGIN',
  name: 'Login Page',
}

const api: ArchitectureCatalogNode = {
  id: 'a1',
  type: 'API_ENDPOINT',
  code: 'POST',
  name: '/auth/login',
}

const api2: ArchitectureCatalogNode = {
  id: 'a2',
  type: 'API_ENDPOINT',
  code: 'POST',
  name: '/auth/logout',
}

function rel(
  partial: Partial<StructureRelation> &
    Pick<StructureRelation, 'fromNodeId' | 'toNodeId' | 'relationType'>
): StructureRelation {
  return {
    id: partial.id ?? 'r1',
    applicationId: 'app',
    workspaceId: 'ws',
    fromNodeType: partial.fromNodeType ?? 'SCREEN',
    toNodeType: partial.toNodeType ?? 'API_ENDPOINT',
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('structure-relation.rules', () => {
  it('blocks self-loop', () => {
    const result = validateLink([], screen, screen, StructureRelationType.Uses, 'focus-as-from')
    expect(result.ok).toBe(false)
  })

  it('detects directed duplicate', () => {
    const items = [
      rel({
        fromNodeId: 's1',
        toNodeId: 'a1',
        relationType: StructureRelationType.Uses,
      }),
    ]
    expect(
      isDuplicateRelation(items, 's1', 'a1', StructureRelationType.Uses)
    ).toBe(true)
    expect(
      isDuplicateRelation(items, 's1', 'a2', StructureRelationType.Uses)
    ).toBe(false)
  })

  it('treats RELATED as undirected for duplicates', () => {
    const items = [
      rel({
        fromNodeId: 's1',
        toNodeId: 'a1',
        relationType: StructureRelationType.Related,
      }),
    ]
    expect(
      isDuplicateRelation(items, 'a1', 's1', StructureRelationType.Related)
    ).toBe(true)
  })

  it('builds outgoing body by default', () => {
    const result = validateLink(
      [],
      screen,
      api,
      StructureRelationType.Uses,
      'focus-as-from'
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.body.fromNodeId).toBe('s1')
      expect(result.body.toNodeId).toBe('a1')
    }
  })

  it('builds incoming body when direction reversed', () => {
    const result = validateLink(
      [],
      screen,
      api,
      StructureRelationType.Uses,
      'focus-as-to'
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.body.fromNodeId).toBe('a1')
      expect(result.body.toNodeId).toBe('s1')
    }
  })

  it('partitions incoming and outgoing', () => {
    const items = [
      rel({ id: '1', fromNodeId: 's1', toNodeId: 'a1', relationType: 'USES' }),
      rel({ id: '2', fromNodeId: 'a2', toNodeId: 's1', relationType: 'USES' }),
    ]
    const { incoming, outgoing } = partitionRelationsForFocus(items, 's1')
    expect(outgoing.map((r) => r.id)).toEqual(['1'])
    expect(incoming.map((r) => r.id)).toEqual(['2'])
  })

  it('builds one-to-many bulk plan', () => {
    const plan = buildBulkPlan(
      [],
      [screen],
      [api, api2],
      StructureRelationType.Uses,
      'focus-as-from'
    )
    expect(plan.kind).toBe('one-to-many')
    expect(plan.newCount).toBe(2)
    expect(plan.duplicateCount).toBe(0)
  })

  it('marks duplicates in bulk plan', () => {
    const items = [
      rel({
        fromNodeId: 's1',
        toNodeId: 'a1',
        relationType: StructureRelationType.Uses,
      }),
    ]
    const plan = buildBulkPlan(
      items,
      [screen],
      [api, api2],
      StructureRelationType.Uses,
      'focus-as-from'
    )
    expect(plan.newCount).toBe(1)
    expect(plan.duplicateCount).toBe(1)
  })
})
