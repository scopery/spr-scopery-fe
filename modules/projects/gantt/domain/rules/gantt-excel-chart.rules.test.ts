import { describe, expect, it } from 'vitest'
import type { GanttItem } from '../model/gantt'
import {
  buildGanttExcelChartColumns,
  ganttExcelBarFillHex,
  itemOverlapsChartColumn,
} from './gantt-excel-chart.rules'

function item(partial: Partial<GanttItem> & Pick<GanttItem, 'id' | 'title'>): GanttItem {
  return {
    itemType: 'TASK',
    sourceEntityType: 'TASK',
    sourceEntityId: partial.id,
    parentItemId: null,
    startDate: null,
    endDate: null,
    scheduleStatus: 'SCHEDULED',
    assigneeUserId: null,
    phaseId: null,
    wbsNodeId: null,
    sortOrder: 0,
    zeroDuration: false,
    metadata: {},
    ...partial,
  }
}

describe('buildGanttExcelChartColumns', () => {
  it('returns empty columns when nothing is scheduled', () => {
    const result = buildGanttExcelChartColumns([
      { item: item({ id: '1', title: 'A' }), depth: 0 },
    ])
    expect(result.columns).toEqual([])
  })

  it('builds day columns for a short span', () => {
    const result = buildGanttExcelChartColumns(
      [
        {
          item: item({
            id: '1',
            title: 'A',
            startDate: '2026-07-01',
            endDate: '2026-07-03',
          }),
          depth: 0,
        },
      ],
      120
    )
    expect(result.scale).toBe('day')
    // padded ±1 day around 01–03 → 31 Jun pad → 06-30? addDays -1 from 07-01 = 06-30
    expect(result.columns[0]?.start).toBe('2026-06-30')
    expect(result.columns.at(-1)?.start).toBe('2026-07-04')
  })

  it('switches to week scale when span exceeds max days', () => {
    const result = buildGanttExcelChartColumns(
      [
        {
          item: item({
            id: '1',
            title: 'Long',
            startDate: '2026-01-01',
            endDate: '2026-12-31',
          }),
          depth: 0,
        },
      ],
      30
    )
    expect(result.scale).toBe('week')
    expect(result.columns.length).toBeGreaterThan(0)
    expect(result.columns.length).toBeLessThan(60)
  })
})

describe('itemOverlapsChartColumn', () => {
  it('detects overlap for inclusive day ranges', () => {
    const task = item({
      id: '1',
      title: 'A',
      startDate: '2026-07-02',
      endDate: '2026-07-04',
    })
    expect(
      itemOverlapsChartColumn(task, {
        start: '2026-07-03',
        end: '2026-07-03',
        label: '7/3',
      })
    ).toBe(true)
    expect(
      itemOverlapsChartColumn(task, {
        start: '2026-07-05',
        end: '2026-07-05',
        label: '7/5',
      })
    ).toBe(false)
  })
})

describe('ganttExcelBarFillHex', () => {
  it('uses warning color for at-risk tasks', () => {
    expect(
      ganttExcelBarFillHex(
        item({ id: '1', title: 'A', scheduleStatus: 'AT_RISK', startDate: '2026-07-01' })
      )
    ).toBe('C2410C')
  })
})
