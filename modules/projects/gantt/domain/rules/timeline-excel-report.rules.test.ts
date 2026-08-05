import { describe, expect, it } from 'vitest'
import type { GanttItem } from '../model/gantt'
import {
  ReportWorkStatus,
  buildTimelineExcelOverviewInsights,
  buildTimelineExcelReportRows,
  deriveReportWorkStatus,
  formatVarianceLabel,
} from './timeline-excel-report.rules'

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

describe('deriveReportWorkStatus', () => {
  it('marks structure rows as em dash status', () => {
    expect(
      deriveReportWorkStatus({
        itemType: 'PHASE',
        scheduleStatus: 'NOT_APPLICABLE',
        planStart: '2026-01-01',
        planEnd: '2026-06-01',
        progressPercent: null,
        taskStatus: null,
        atRisk: false,
        today: '2026-08-05',
      })
    ).toBe(ReportWorkStatus.Structure)
  })

  it('detects overdue when past plan end and not completed', () => {
    expect(
      deriveReportWorkStatus({
        itemType: 'TASK',
        scheduleStatus: 'SCHEDULED',
        planStart: '2026-07-01',
        planEnd: '2026-08-04',
        progressPercent: 40,
        taskStatus: 'IN_PROGRESS',
        atRisk: false,
        today: '2026-08-05',
      })
    ).toBe(ReportWorkStatus.Overdue)
  })

  it('detects completed via progress 100', () => {
    expect(
      deriveReportWorkStatus({
        itemType: 'TASK',
        scheduleStatus: 'SCHEDULED',
        planStart: '2026-07-01',
        planEnd: '2026-08-04',
        progressPercent: 100,
        taskStatus: 'IN_PROGRESS',
        atRisk: false,
        today: '2026-08-05',
      })
    ).toBe(ReportWorkStatus.Completed)
  })
})

describe('buildTimelineExcelReportRows', () => {
  it('assigns WBS codes and owner names; hides NOT_APPLICABLE as —', () => {
    const rows = buildTimelineExcelReportRows(
      [
        item({
          id: 'p1',
          title: 'Phase A',
          itemType: 'PHASE',
          scheduleStatus: 'NOT_APPLICABLE',
          startDate: '2026-01-01',
          endDate: '2026-12-01',
          children: [
            item({
              id: 't1',
              title: 'Task 1',
              startDate: '2026-07-01',
              endDate: '2026-07-10',
              assigneeUserId: 'u1',
            }),
          ],
        }),
      ],
      {
        ownerLabelFor: (id) => (id === 'u1' ? 'Alice' : id),
        enrichmentBySourceId: new Map([
          [
            't1',
            {
              status: 'IN_PROGRESS',
              progressPercent: 50,
              atRisk: false,
              inChargeUserId: 'u1',
              dueDate: '2026-07-12',
            },
          ],
        ]),
        today: '2026-07-05',
      }
    )

    expect(rows[0]?.wbs).toBe('1')
    expect(rows[0]?.statusLabel).toBe('—')
    expect(rows[1]?.wbs).toBe('1.1')
    expect(rows[1]?.owner).toBe('Alice')
    expect(rows[1]?.progressPercent).toBe(50)
    expect(rows[1]?.dueDate).toBe('2026-07-12')
  })
})

describe('buildTimelineExcelOverviewInsights', () => {
  it('counts overdue and builds narrative', () => {
    const rows = buildTimelineExcelReportRows(
      [
        item({
          id: 't1',
          title: 'Late task',
          startDate: '2026-07-01',
          endDate: '2026-08-04',
        }),
      ],
      {
        enrichmentBySourceId: new Map([
          [
            't1',
            {
              status: 'IN_PROGRESS',
              progressPercent: 20,
              atRisk: false,
              inChargeUserId: null,
            },
          ],
        ]),
        today: '2026-08-05',
      }
    )
    const insights = buildTimelineExcelOverviewInsights(rows, '2026-08-05')
    expect(insights.overdueCount).toBe(1)
    expect(insights.narrative).toMatch(/behind plan|past plan end/i)
    expect(formatVarianceLabel(1)).toBe('1d late')
  })
})
