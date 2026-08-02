import { describe, expect, it } from 'vitest'
import {
  buildTimelineDependencyPaths,
  computeBarPixelRange,
} from './timeline-dependency-links.rules'
import type { TimelineColumn, TimelineFlatRow } from '../model/timeline'
import type { GanttDependency } from '../model/gantt'

function col(key: string, start: string, end: string): TimelineColumn {
  return {
    key,
    label: key,
    periodStart: start,
    periodEnd: end,
    isWeekend: false,
    isToday: false,
    isMonthBoundary: false,
  }
}

function taskRow(
  id: string,
  taskId: string,
  startDate: string,
  endDate: string
): TimelineFlatRow {
  return {
    id,
    kind: 'task',
    depth: 1,
    title: taskId,
    displayPrimary: taskId,
    displaySecondary: null,
    phaseCode: null,
    itemType: 'TASK',
    sourceEntityId: taskId,
    phaseId: null,
    parentPhaseSourceId: null,
    scheduleStatus: 'SCHEDULED',
    assigneeUserId: null,
    estimateHours: 8,
    status: 'TODO',
    progressPercent: null,
    atRisk: false,
    startDate,
    endDate,
  }
}

describe('computeBarPixelRange', () => {
  it('maps a one-day task inside a day column', () => {
    const columns = [col('d1', '2026-08-03', '2026-08-03'), col('d2', '2026-08-04', '2026-08-04')]
    const range = computeBarPixelRange('2026-08-03', '2026-08-03', columns, 100)
    expect(range).toEqual({ left: 0, right: 100 })
  })
})

describe('buildTimelineDependencyPaths', () => {
  it('builds a forward FS path with stub → vertical → into', () => {
    const columns = [
      col('d1', '2026-08-03', '2026-08-03'),
      col('d2', '2026-08-04', '2026-08-04'),
      col('d3', '2026-08-05', '2026-08-05'),
    ]
    const rows = [
      taskRow('r1', 't1', '2026-08-03', '2026-08-03'),
      taskRow('r2', 't2', '2026-08-05', '2026-08-05'),
    ]
    const deps: GanttDependency[] = [
      {
        id: 'dep1',
        projectId: 'p',
        predecessorTaskId: 't1',
        successorTaskId: 't2',
        dependencyType: 'FS',
        lagDays: 0,
      },
    ]
    const paths = buildTimelineDependencyPaths(deps, rows, columns, 54)
    expect(paths).toHaveLength(1)
    expect(paths[0]?.id).toBe('dep1')
    // forward FS: M exit H stub V targetY H targetX
    expect(paths[0]?.d).toMatch(/^M [\d.]+ [\d.]+ H [\d.]+ V [\d.]+ H [\d.]+$/)
  })

  it('wraps adjacent FS links via mid-Y instead of a bare L', () => {
    const columns = [
      col('d1', '2026-08-02', '2026-08-02'),
      col('d2', '2026-08-03', '2026-08-03'),
    ]
    const rows = [
      taskRow('r1', 't1', '2026-08-02', '2026-08-02'),
      taskRow('r2', 't2', '2026-08-03', '2026-08-03'),
    ]
    const deps: GanttDependency[] = [
      {
        id: 'dep-adj',
        projectId: 'p',
        predecessorTaskId: 't1',
        successorTaskId: 't2',
        dependencyType: 'FS',
        lagDays: 0,
      },
    ]
    const paths = buildTimelineDependencyPaths(deps, rows, columns, 54)
    expect(paths).toHaveLength(1)
    // wrap: stub → midY → entry → targetY → into bar
    expect(paths[0]?.d.split(' ').filter((t) => t === 'V' || t === 'H').length).toBeGreaterThanOrEqual(4)
  })

  it('routes SS on the left rail', () => {
    const columns = [
      col('d1', '2026-08-03', '2026-08-03'),
      col('d2', '2026-08-04', '2026-08-04'),
      col('d3', '2026-08-05', '2026-08-05'),
    ]
    const rows = [
      taskRow('r1', 't1', '2026-08-03', '2026-08-04'),
      taskRow('r2', 't2', '2026-08-03', '2026-08-05'),
    ]
    const deps: GanttDependency[] = [
      {
        id: 'dep-ss',
        projectId: 'p',
        predecessorTaskId: 't1',
        successorTaskId: 't2',
        dependencyType: 'SS',
        lagDays: 0,
      },
    ]
    const paths = buildTimelineDependencyPaths(deps, rows, columns, 54)
    expect(paths[0]?.dependencyType).toBe('SS')
    expect(paths[0]?.d.startsWith('M ')).toBe(true)
  })
})
