import { describe, expect, it } from 'vitest'
import { WbsNodeStatus, WbsNodeType } from '../enums/wbs.enum'
import type { WbsTreeNode } from '../model/wbs'
import { groupWbsTreeByPhase } from './wbs.rules'

function node(
  partial: Pick<WbsTreeNode, 'id' | 'projectPhaseId'> & Partial<WbsTreeNode>
): WbsTreeNode {
  return {
    projectId: 'p',
    parentId: null,
    code: partial.id,
    title: partial.id,
    description: null,
    nodeType: WbsNodeType.WorkPackage,
    level: 1,
    path: partial.id,
    sortOrder: 1,
    status: WbsNodeStatus.Active,
    version: 1,
    createdAt: '',
    updatedAt: '',
    children: [],
    ...partial,
  }
}

describe('groupWbsTreeByPhase', () => {
  it('puts unassigned roots first, then phases in order', () => {
    const tree = [
      node({ id: 'a', projectPhaseId: 'ph-2' }),
      node({ id: 'b', projectPhaseId: null }),
      node({ id: 'c', projectPhaseId: 'ph-1' }),
    ]
    const groups = groupWbsTreeByPhase(tree, [{ id: 'ph-1' }, { id: 'ph-2' }])
    expect(groups.map((g) => g.phaseId)).toEqual([null, 'ph-1', 'ph-2'])
    expect(groups[0]!.roots.map((n) => n.id)).toEqual(['b'])
    expect(groups[1]!.roots.map((n) => n.id)).toEqual(['c'])
    expect(groups[2]!.roots.map((n) => n.id)).toEqual(['a'])
  })

  it('keeps empty phase groups so dividers still render', () => {
    const groups = groupWbsTreeByPhase([], [{ id: 'ph-1' }])
    expect(groups).toEqual([
      { phaseId: null, roots: [] },
      { phaseId: 'ph-1', roots: [] },
    ])
  })
})
