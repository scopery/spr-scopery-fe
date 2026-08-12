import { describe, expect, it } from 'vitest'
import {
  getArchitectureDeleteBlockReason,
  isArchitectureNodeDeletable,
} from './architecture-delete.rules'
import type { BrowseCatalogNode } from './architecture-workbench'
import type { StructureRelation } from './structure-relation'

const screen: BrowseCatalogNode = {
  id: 's1',
  type: 'SCREEN',
  code: 'SCR-1',
  name: 'Home',
}

const communication: BrowseCatalogNode = {
  id: 'c1',
  type: 'COMMUNICATION',
  code: 'COM-1',
  name: 'Notify',
}

const relation: StructureRelation = {
  id: 'r1',
  applicationId: 'app',
  workspaceId: 'ws',
  fromNodeType: 'SCREEN',
  fromNodeId: 's1',
  toNodeType: 'API_ENDPOINT',
  toNodeId: 'a1',
  relationType: 'USES',
  createdAt: '',
  updatedAt: '',
}

describe('architecture-delete.rules', () => {
  it('blocks delete when structure relations involve the node', () => {
    expect(getArchitectureDeleteBlockReason(screen, [relation])).toMatch(/Unlink 1 structure/)
    expect(isArchitectureNodeDeletable(screen, [relation])).toBe(false)
  })

  it('allows delete when no structure relations', () => {
    expect(getArchitectureDeleteBlockReason(screen, [])).toBeNull()
    expect(isArchitectureNodeDeletable(screen, [])).toBe(true)
  })

  it('allows communication archive regardless of structure relations', () => {
    expect(getArchitectureDeleteBlockReason(communication, [relation])).toBeNull()
  })
})
