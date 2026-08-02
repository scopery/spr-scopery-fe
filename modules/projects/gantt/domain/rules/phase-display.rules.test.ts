import { describe, expect, it } from 'vitest'
import { resolvePhaseDisplay, stripPhaseNamePrefix } from './phase-display.rules'
import { summarizePhaseSubtree } from './phase-row-summary.rules'
import type { GanttTreeItem } from '../model/gantt'
import type { TaskEnrichment } from './timeline-rows.rules'

function taskNode(
  id: string,
  sourceEntityId: string,
  dates: { startDate: string | null; endDate: string | null }
): GanttTreeItem {
  return {
    id,
    itemType: 'TASK',
    sourceEntityType: 'TASK',
    sourceEntityId,
    parentItemId: 'p1',
    title: id,
    startDate: dates.startDate,
    endDate: dates.endDate,
    scheduleStatus: 'OK',
    assigneeUserId: null,
    phaseId: 'phase-1',
    wbsNodeId: null,
    sortOrder: 0,
    zeroDuration: false,
    metadata: {},
    children: [],
  }
}

describe('phase-display.rules', () => {
  it('strips Implement Module prefix', () => {
    expect(
      stripPhaseNamePrefix('Implement Module: Notifications & Common Services')
    ).toBe('Notifications & Common Services')
  })

  it('prefers phase name + code for secondary', () => {
    const d = resolvePhaseDisplay({
      ganttTitle: 'Implement Module: Notifications & Common Services',
      code: 'PH-06',
      name: 'Implement Module: Notifications & Common Services',
      statusLabel: 'In progress',
    })
    expect(d.primary).toBe('Notifications & Common Services')
    expect(d.secondary).toBe('PH-06 · In progress')
    expect(d.code).toBe('PH-06')
  })
})

describe('phase-row-summary.rules', () => {
  it('counts tasks under a phase', () => {
    const phase: GanttTreeItem = {
      id: 'p1',
      itemType: 'PHASE',
      sourceEntityType: 'PHASE',
      sourceEntityId: 'phase-1',
      parentItemId: null,
      title: 'Phase',
      startDate: '2026-06-01',
      endDate: '2026-07-01',
      scheduleStatus: 'OK',
      assigneeUserId: null,
      phaseId: 'phase-1',
      wbsNodeId: null,
      sortOrder: 0,
      zeroDuration: false,
      metadata: {},
      children: [
        taskNode('t1', 'task-1', { startDate: null, endDate: null }),
        taskNode('t2', 'task-2', {
          startDate: '2026-06-02',
          endDate: '2026-06-05',
        }),
      ],
    }
    const taskById = new Map<string, TaskEnrichment>([
      [
        'task-1',
        {
          estimateHours: 8,
          status: 'TODO',
          inChargeUserId: null,
          progressPercent: 0,
          atRisk: false,
        },
      ],
      [
        'task-2',
        {
          estimateHours: 8,
          status: 'COMPLETED',
          inChargeUserId: null,
          progressPercent: 100,
          atRisk: true,
        },
      ],
    ])
    const summary = summarizePhaseSubtree(phase, taskById)
    expect(summary.taskCount).toBe(2)
    expect(summary.completedCount).toBe(1)
    expect(summary.unscheduledCount).toBe(1)
    expect(summary.atRiskCount).toBe(1)
    expect(summary.progressPercent).toBe(50)
  })
})
