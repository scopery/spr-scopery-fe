import {
  downloadScheduleReportWorkbook,
  formatExcelDisplayDate,
  type ScheduleReportExcelRow,
} from '@/shared/lib/excel'
import type { GanttItem } from '../domain/model/gantt'
import {
  buildTimelineExcelOverviewInsights,
  buildTimelineExcelReportRows,
  formatVarianceLabel,
  type TimelineExcelEnrichment,
} from '../domain/rules/timeline-excel-report.rules'
import type { TaskEnrichment } from '../domain/rules/timeline-rows.rules'

export interface DownloadGanttExcelOptions {
  projectName?: string | null
  fileName?: string
  ownerLabelFor?: (userId: string) => string
  enrichmentBySourceId?: Map<string, TimelineExcelEnrichment | TaskEnrichment>
}

function toScheduleRows(
  reportRows: ReturnType<typeof buildTimelineExcelReportRows>
): ScheduleReportExcelRow[] {
  return reportRows.map((r) => ({
    wbs: r.wbs,
    workItem: r.workItem,
    owner: r.owner,
    statusLabel: r.statusLabel,
    statusKey: r.reportStatus,
    planStart: r.planStart,
    planEnd: r.planEnd,
    dueDate: r.dueDate,
    progressPercent: r.progressPercent,
    varianceLabel: formatVarianceLabel(r.varianceDays),
    isMilestone: r.isMilestone,
    isLeafWork: r.isLeafWork,
    raw: r.raw,
  }))
}

/**
 * Project Timeline → decision-support Excel:
 * Overview (KPIs) + Schedule (WBS/Owner/Status + Gantt) + hidden Raw data.
 * Visual style: `@/shared/lib/excel/style.ts`.
 */
export async function downloadGanttExcel(
  items: GanttItem[],
  opts?: DownloadGanttExcelOptions
): Promise<void> {
  const reportRows = buildTimelineExcelReportRows(items, {
    ownerLabelFor: opts?.ownerLabelFor,
    enrichmentBySourceId: opts?.enrichmentBySourceId,
  })
  const insights = buildTimelineExcelOverviewInsights(reportRows)
  const scheduleRows = toScheduleRows(reportRows)

  const durationLabel =
    insights.projectStart && insights.projectEnd
      ? `${formatExcelDisplayDate(insights.projectStart)} – ${formatExcelDisplayDate(
          insights.projectEnd
        )}`
      : '—'

  await downloadScheduleReportWorkbook(scheduleRows, {
    fileName: opts?.fileName ?? opts?.projectName ?? undefined,
    fileNameFallback: 'gantt-timeline',
    overview: {
      title: opts?.projectName ? `${opts.projectName} · Timeline` : 'Project Timeline',
      narrative: insights.narrative,
      kpis: [
        { label: 'In progress', value: insights.inProgressCount },
        { label: 'Overdue', value: insights.overdueCount },
        { label: 'At risk', value: insights.atRiskCount },
        { label: 'Due this week', value: insights.dueThisWeekCount },
        {
          label: 'Overall progress',
          value:
            insights.overallProgressPercent != null
              ? `${insights.overallProgressPercent}%`
              : '—',
        },
        {
          label: 'Time elapsed',
          value:
            insights.timeElapsedPercent != null
              ? `${insights.timeElapsedPercent}%`
              : '—',
        },
      ],
      metaLines: [
        ['Project duration', durationLabel],
        ['Active phases today', insights.activePhasesToday],
        [
          'Phases with detailed tasks',
          `${insights.phasesWithTasks}/${insights.phaseCount}`,
        ],
        ['Upcoming (14 days)', insights.upcoming14Count],
        [
          'Days behind plan',
          insights.daysBehindPlan > 0 ? insights.daysBehindPlan : '0',
        ],
      ],
      lists: [
        {
          title: 'Overdue / past plan end',
          headers: ['WBS', 'Work item', 'Plan end', 'Late by'],
          rows: insights.overdueItems.map((i) => [
            i.wbs,
            i.title,
            formatExcelDisplayDate(i.planEnd),
            i.varianceDays != null ? `${i.varianceDays}d` : '—',
          ]),
        },
        {
          title: 'At risk',
          headers: ['WBS', 'Work item', 'Progress'],
          rows: insights.atRiskItems.map((i) => [
            i.wbs,
            i.title,
            i.progress != null ? `${i.progress}%` : '—',
          ]),
        },
        {
          title: 'Ending this week',
          headers: ['WBS', 'Work item', 'Plan end'],
          rows: insights.endingThisWeek.map((i) => [
            i.wbs,
            i.title,
            formatExcelDisplayDate(i.planEnd),
          ]),
        },
        {
          title: 'Upcoming next 14 days',
          headers: ['WBS', 'Work item', 'Plan start'],
          rows: insights.upcoming14.map((i) => [
            i.wbs,
            i.title,
            formatExcelDisplayDate(i.planStart),
          ]),
        },
        {
          title: 'Workload by assignee',
          headers: ['Owner', 'Items'],
          rows: insights.workloadByOwner.map((w) => [w.owner, w.count]),
        },
      ],
    },
  })
}
