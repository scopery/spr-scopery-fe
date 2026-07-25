import { describe, expect, it } from 'vitest'
import { buildGanttTree } from '../domain/rules/gantt.rules'
import type { GanttItem } from '../domain/model/gantt'
import {
  mapGanttTreeToSvarTasks,
  resolveChartViewport,
  resolveInclusiveBarDates,
  toDateOnlyFromSvar,
} from './mapToSvarGantt'

function taskItem(partial: Partial<GanttItem> & Pick<GanttItem, 'id' | 'title'>): GanttItem {
  return {
    itemType: 'TASK',
    sourceEntityType: 'TASK',
    sourceEntityId: partial.id.replace(/^TASK:/, ''),
    parentItemId: 'PROJECT:p1',
    startDate: null,
    endDate: null,
    scheduleStatus: 'UNSCHEDULED',
    assigneeUserId: null,
    phaseId: null,
    wbsNodeId: null,
    sortOrder: 0,
    zeroDuration: false,
    metadata: {},
    ...partial,
  }
}

describe('resolveInclusiveBarDates', () => {
  it('uses both start and end when present', () => {
    const bar = resolveInclusiveBarDates('2026-08-01', '2026-08-05')
    expect(bar).not.toBeNull()
    expect(toDateOnlyFromSvar(bar!.start)).toBe('2026-08-01')
    expect(toDateOnlyFromSvar(bar!.end)).toBe('2026-08-05')
  })

  it('uses due-date-only as a one-day bar (PARTIAL)', () => {
    const bar = resolveInclusiveBarDates(null, '2026-09-15')
    expect(bar).not.toBeNull()
    expect(toDateOnlyFromSvar(bar!.start)).toBe('2026-09-15')
    expect(toDateOnlyFromSvar(bar!.end)).toBe('2026-09-15')
  })

  it('uses start-only as a one-day bar', () => {
    const bar = resolveInclusiveBarDates('2026-07-01', null)
    expect(bar).not.toBeNull()
    expect(toDateOnlyFromSvar(bar!.start)).toBe('2026-07-01')
    expect(toDateOnlyFromSvar(bar!.end)).toBe('2026-07-01')
  })

  it('returns null when both missing', () => {
    expect(resolveInclusiveBarDates(null, null)).toBeNull()
  })
})

describe('mapGanttTreeToSvarTasks', () => {
  it('renders due-date-only tasks at the due date, not the fallback', () => {
    const items: GanttItem[] = [
      {
        id: 'PROJECT:p1',
        itemType: 'PROJECT',
        sourceEntityType: 'PROJECT',
        sourceEntityId: 'p1',
        parentItemId: null,
        title: 'Project',
        startDate: '2026-08-01',
        endDate: '2026-08-30',
        scheduleStatus: 'NOT_APPLICABLE',
        assigneeUserId: null,
        phaseId: null,
        wbsNodeId: null,
        sortOrder: 0,
        zeroDuration: false,
        metadata: {},
      },
      taskItem({
        id: 'TASK:t1',
        title: 'Has due only',
        startDate: null,
        endDate: '2026-09-15',
        scheduleStatus: 'PARTIAL',
      }),
    ]

    const tasks = mapGanttTreeToSvarTasks(buildGanttTree(items))
    const task = tasks.find((t) => t.id === 'TASK:t1')
    expect(task).toBeDefined()
    expect(toDateOnlyFromSvar(task!.start)).toBe('2026-09-15')
    expect(task!.duration).toBe(1)
    expect(task!.isPlaceholderSchedule).toBe(false)
    expect(task!.text).toBe('Has due only')
  })

  it('keeps full schedule ranges inclusive', () => {
    const items: GanttItem[] = [
      taskItem({
        id: 'TASK:t2',
        title: 'Scheduled',
        startDate: '2026-08-02',
        endDate: '2026-08-04',
        scheduleStatus: 'SCHEDULED',
        parentItemId: null,
      }),
    ]

    const tasks = mapGanttTreeToSvarTasks(buildGanttTree(items))
    const task = tasks.find((t) => t.id === 'TASK:t2')
    expect(toDateOnlyFromSvar(task!.start)).toBe('2026-08-02')
    expect(task!.duration).toBe(3)
    expect(task!.isPlaceholderSchedule).toBe(false)
  })

  it('marks fully unscheduled tasks as placeholders', () => {
    const items: GanttItem[] = [
      taskItem({
        id: 'TASK:t3',
        title: 'No dates',
        parentItemId: null,
      }),
    ]

    const tasks = mapGanttTreeToSvarTasks(buildGanttTree(items))
    const task = tasks.find((t) => t.id === 'TASK:t3')
    expect(task!.isPlaceholderSchedule).toBe(true)
    expect(String(task!.text)).toContain('(unscheduled)')
  })
})

describe('resolveChartViewport', () => {
  it('pads around real bars and ignores placeholders', () => {
    const tasks = mapGanttTreeToSvarTasks(
      buildGanttTree([
        taskItem({
          id: 'TASK:real',
          title: 'Real',
          startDate: '2026-10-01',
          endDate: '2026-10-05',
          scheduleStatus: 'SCHEDULED',
          parentItemId: null,
        }),
        taskItem({
          id: 'TASK:ghost',
          title: 'Ghost',
          parentItemId: null,
        }),
      ])
    )

    const vp = resolveChartViewport(tasks, 2)
    expect(toDateOnlyFromSvar(vp.start)).toBe('2026-09-29')
    // last inclusive day 2026-10-05 → exclusive 10-06 + 2 pad days → 10-08
    expect(toDateOnlyFromSvar(vp.end)).toBe('2026-10-08')
  })
})
