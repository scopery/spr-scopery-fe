import { describe, expect, it } from 'vitest'
import type { GanttTreeItem } from '../model/gantt'
import {
  collectProjectCollapseIds,
  flattenTimelineRows,
} from './timeline-rows.rules'

function node(
  partial: Partial<GanttTreeItem> &
    Pick<GanttTreeItem, 'id' | 'itemType' | 'title'>
): GanttTreeItem {
  return {
    id: partial.id,
    itemType: partial.itemType,
    title: partial.title,
    sourceEntityId: partial.sourceEntityId ?? partial.id,
    sourceEntityType: partial.sourceEntityType ?? partial.itemType,
    parentItemId: partial.parentItemId ?? null,
    phaseId: partial.phaseId ?? null,
    assigneeUserId: partial.assigneeUserId ?? null,
    scheduleStatus: partial.scheduleStatus ?? 'SCHEDULED',
    startDate: partial.startDate ?? '2026-08-01',
    endDate: partial.endDate ?? '2026-08-10',
    wbsNodeId: partial.wbsNodeId ?? null,
    sortOrder: partial.sortOrder ?? 0,
    zeroDuration: partial.zeroDuration ?? false,
    metadata: partial.metadata ?? {},
    children: partial.children ?? [],
  }
}

const tree: GanttTreeItem[] = [
  node({
    id: 'proj',
    itemType: 'PROJECT',
    title: 'Project',
    children: [
      node({
        id: 'phase',
        itemType: 'PHASE',
        title: 'Phase',
        children: [
          node({
            id: 'wbs',
            itemType: 'WBS_NODE',
            title: 'WBS',
            children: [
              node({ id: 'task', itemType: 'TASK', title: 'Task A' }),
              node({ id: 'ms', itemType: 'MILESTONE', title: 'MS' }),
            ],
          }),
        ],
      }),
    ],
  }),
]

describe('collectProjectCollapseIds', () => {
  it('collects PROJECT ids', () => {
    expect([...collectProjectCollapseIds(tree)]).toEqual(['proj'])
  })
})

describe('flattenTimelineRows hideTaskRows', () => {
  it('keeps structure and hides tasks when hideTaskRows is true', () => {
    const rows = flattenTimelineRows(tree, {
      collapsedPhaseIds: new Set(),
      hideUnscheduled: false,
      taskById: new Map(),
      hideTaskRows: true,
    })
    const kinds = rows.map((r) => r.itemType)
    expect(kinds).toContain('PROJECT')
    expect(kinds).toContain('PHASE')
    expect(kinds).toContain('WBS_NODE')
    expect(kinds).not.toContain('TASK')
    expect(kinds).not.toContain('MILESTONE')
    expect(kinds).not.toContain('ADD')
  })

  it('hides children when PROJECT is collapsed', () => {
    const rows = flattenTimelineRows(tree, {
      collapsedPhaseIds: collectProjectCollapseIds(tree),
      hideUnscheduled: false,
      taskById: new Map(),
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.itemType).toBe('PROJECT')
  })
})
