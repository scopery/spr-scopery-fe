import { describe, expect, it } from 'vitest'
import {
  buildGanttTree,
  repairGanttWbsParents,
  resolveRecalculatePlanningWindow,
} from './gantt.rules'
import type { GanttItem } from '../model/gantt'

function item(partial: Partial<GanttItem> & Pick<GanttItem, 'id' | 'itemType'>): GanttItem {
  return {
    sourceEntityType: partial.itemType,
    sourceEntityId: partial.sourceEntityId ?? partial.id.split(':')[1] ?? partial.id,
    parentItemId: partial.parentItemId ?? null,
    title: partial.title ?? partial.id,
    startDate: partial.startDate ?? null,
    endDate: partial.endDate ?? null,
    scheduleStatus: 'NOT_APPLICABLE',
    assigneeUserId: null,
    phaseId: partial.phaseId ?? null,
    wbsNodeId: partial.wbsNodeId ?? null,
    sortOrder: partial.sortOrder ?? 0,
    zeroDuration: false,
    metadata: {},
    ...partial,
  }
}

describe('repairGanttWbsParents', () => {
  it('nests child planning elements under their parent WBS id', () => {
    const items = [
      item({ id: 'PROJECT:p', itemType: 'PROJECT', sourceEntityId: 'p', parentItemId: null }),
      item({
        id: 'PHASE:ph',
        itemType: 'PHASE',
        sourceEntityId: 'ph',
        parentItemId: 'PROJECT:p',
      }),
      // Child emitted before parent, wrongly attached to phase (legacy BE bug shape)
      item({
        id: 'WBS:child',
        itemType: 'WBS_NODE',
        sourceEntityId: 'child',
        parentItemId: 'PHASE:ph',
        phaseId: 'ph',
        wbsNodeId: 'child',
      }),
      item({
        id: 'WBS:parent',
        itemType: 'WBS_NODE',
        sourceEntityId: 'parent',
        parentItemId: 'PHASE:ph',
        phaseId: 'ph',
        wbsNodeId: 'parent',
      }),
    ]
    const meta = new Map([
      ['parent', { parentId: null, phaseId: 'ph' }],
      ['child', { parentId: 'parent', phaseId: 'ph' }],
    ])
    const repaired = repairGanttWbsParents(items, meta)
    expect(repaired.find((i) => i.id === 'WBS:child')?.parentItemId).toBe('WBS:parent')
    expect(repaired.find((i) => i.id === 'WBS:parent')?.parentItemId).toBe('PHASE:ph')

    const tree = buildGanttTree(repaired)
    const phase = tree[0]?.children.find((c) => c.id === 'PHASE:ph')
    const parent = phase?.children.find((c) => c.id === 'WBS:parent')
    expect(parent?.children.some((c) => c.id === 'WBS:child')).toBe(true)
  })
})


describe('resolveRecalculatePlanningWindow', () => {
  it('uses explicit dates when provided', () => {
    expect(
      resolveRecalculatePlanningWindow({
        planningStartDate: '2026-08-01',
        planningEndDate: '2026-08-31',
      })
    ).toEqual({
      planningStartDate: '2026-08-01',
      planningEndDate: '2026-08-31',
    })
  })

  it('falls back to schedule run window', () => {
    expect(
      resolveRecalculatePlanningWindow({
        scheduleRun: {
          planningStartDate: '2026-07-01T00:00:00Z',
          planningEndDate: '2026-09-30',
        },
      })
    ).toEqual({
      planningStartDate: '2026-07-01',
      planningEndDate: '2026-09-30',
    })
  })

  it('derives from item dates with pad', () => {
    const result = resolveRecalculatePlanningWindow({
      items: [
        { startDate: '2026-08-10', endDate: '2026-08-12' },
        { startDate: '2026-08-20', endDate: '2026-08-22' },
      ],
      padDays: 7,
    })
    // Window covers item span ± pad, and expands to include today when needed.
    expect(result.planningStartDate <= '2026-08-03').toBe(true)
    expect(result.planningEndDate >= '2026-08-29').toBe(true)
  })
})
