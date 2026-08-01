import { describe, expect, it } from 'vitest'
import type { FunctionalItem } from './functional-catalog'
import type { OverallStructureResponse } from './overall-structure'
import {
  filterTreeFunctionsByProject,
  findFunctionProjectId,
  mergeFunctionalItemsIntoTree,
} from './structure-function-merge'

const baseTree = (): OverallStructureResponse => ({
  applicationId: 'app1',
  workspaceId: 'ws1',
  modules: [
    {
      id: 'm1',
      code: 'M1',
      name: 'Module 1',
      functions: [
        {
          id: 'f1',
          projectId: 'other-project',
          code: 'F1',
          title: 'Old title',
          moduleId: 'm1',
          screens: [{ id: 's1', code: 'S1', name: 'Screen', components: [] }],
          apis: [],
        },
      ],
      entities: [],
    },
  ],
  unassignedFunctions: [],
})

function fi(
  partial: Pick<FunctionalItem, 'id' | 'code' | 'title'> & {
    moduleId?: string | null
    projectId?: string
  }
): FunctionalItem {
  return {
    id: partial.id,
    projectId: partial.projectId ?? 'p1',
    workspaceId: 'ws1',
    code: partial.code,
    title: partial.title,
    priority: 'MEDIUM',
    status: 'DRAFT',
    type: 'FUNCTIONAL',
    moduleId: partial.moduleId ?? null,
    createdAt: '',
    updatedAt: '',
  }
}

describe('mergeFunctionalItemsIntoTree', () => {
  it('places catalog items under modules and preserves screens/apis', () => {
    const next = mergeFunctionalItemsIntoTree(baseTree(), [
      fi({ id: 'f1', code: 'F1', title: 'Login', moduleId: 'm1' }),
      fi({ id: 'f2', code: 'F2', title: 'Unmapped' }),
    ])
    expect(next.modules[0].functions).toHaveLength(1)
    expect(next.modules[0].functions[0].title).toBe('Login')
    expect(next.modules[0].functions[0].projectId).toBe('p1')
    expect(next.modules[0].functions[0].screens).toHaveLength(1)
    expect(next.unassignedFunctions).toHaveLength(1)
    expect(next.unassignedFunctions?.[0].id).toBe('f2')
  })

  it('clears foreign Functions when selected project catalog is empty', () => {
    const next = mergeFunctionalItemsIntoTree(baseTree(), [])
    expect(next.modules[0].functions).toEqual([])
    expect(next.unassignedFunctions).toEqual([])
  })
})

describe('filterTreeFunctionsByProject', () => {
  it('drops Functions owned by other projects', () => {
    const next = filterTreeFunctionsByProject(baseTree(), 'p1')
    expect(next.modules[0].functions).toEqual([])
  })

  it('keeps Functions without projectId (unknown ownership)', () => {
    const tree = baseTree()
    tree.modules[0].functions[0].projectId = null
    const next = filterTreeFunctionsByProject(tree, 'p1')
    expect(next.modules[0].functions).toHaveLength(1)
  })
})

describe('findFunctionProjectId', () => {
  it('reads projectId from the tree', () => {
    expect(findFunctionProjectId(baseTree(), 'f1')).toBe('other-project')
    expect(findFunctionProjectId(baseTree(), 'missing')).toBeNull()
  })
})
