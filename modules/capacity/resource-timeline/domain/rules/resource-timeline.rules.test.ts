import { describe, expect, it } from 'vitest'
import type { GanttTreeItem } from '@/modules/projects/gantt'
import {
  filterAndPruneGanttTree,
  mapWithConcurrency,
} from './resource-timeline.rules'

function node(
  partial: Partial<GanttTreeItem> &
    Pick<GanttTreeItem, 'id' | 'itemType' | 'title'>
): GanttTreeItem {
  return {
    sourceEntityType: 'TASK',
    sourceEntityId: partial.sourceEntityId ?? partial.id,
    parentItemId: null,
    phaseId: null,
    wbsNodeId: null,
    assigneeUserId: null,
    scheduleStatus: 'SCHEDULED',
    startDate: '2026-08-01',
    endDate: '2026-08-10',
    sortOrder: 0,
    zeroDuration: false,
    metadata: {},
    children: [],
    ...partial,
  }
}

describe('filterAndPruneGanttTree', () => {
  const tree: GanttTreeItem[] = [
    node({
      id: 'proj',
      itemType: 'PROJECT',
      title: 'P',
      children: [
        node({
          id: 'phase',
          itemType: 'PHASE',
          title: 'Ph',
          children: [
            node({
              id: 'wbs',
              itemType: 'WBS_NODE',
              title: 'W',
              children: [
                node({
                  id: 't1',
                  itemType: 'TASK',
                  title: 'Mine',
                  assigneeUserId: 'u1',
                }),
                node({
                  id: 't2',
                  itemType: 'TASK',
                  title: 'Other',
                  assigneeUserId: 'u2',
                }),
                node({
                  id: 't3',
                  itemType: 'TASK',
                  title: 'Open',
                  assigneeUserId: null,
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ]

  it('keeps member tasks and ancestors', () => {
    const pruned = filterAndPruneGanttTree(tree, 'u1', false)
    expect(pruned).toHaveLength(1)
    const leaves = pruned[0]!.children[0]!.children[0]!.children
    expect(leaves.map((l) => l.id)).toEqual(['t1'])
  })

  it('includes unassigned when toggled', () => {
    const pruned = filterAndPruneGanttTree(tree, 'u1', true)
    const leaves = pruned[0]!.children[0]!.children[0]!.children
    expect(leaves.map((l) => l.id).sort()).toEqual(['t1', 't3'])
  })

  it('drops empty projects', () => {
    const pruned = filterAndPruneGanttTree(tree, 'nobody', false)
    expect(pruned).toHaveLength(0)
  })
})

describe('mapWithConcurrency', () => {
  it('preserves order with limited concurrency', async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => n * 10)
    expect(out).toEqual([10, 20, 30, 40])
  })
})
