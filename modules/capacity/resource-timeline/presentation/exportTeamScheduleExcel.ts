import {
  downloadScheduleReportWorkbook,
  formatExcelDisplayDate,
  toExcelDateOnly,
  type ScheduleReportExcelRow,
} from '@/shared/lib/excel'
import {
  REPORT_STATUS_LABEL,
  buildTimelineExcelOverviewInsights,
  computeVarianceDays,
  deriveReportWorkStatus,
  formatVarianceLabel,
  ganttItemTypeLabel,
  type TimelineFlatRow,
  type TimelineExcelReportRow,
} from '@/modules/projects/gantt'

export interface TeamScheduleExcelOptions {
  workspaceName?: string | null
  fileName?: string
  personLabelFor: (userId: string) => string
  projectNameForTask: (sourceEntityId: string | null | undefined) => string | null
}

function mapToReportRows(
  rows: TimelineFlatRow[],
  opts: TeamScheduleExcelOptions
): TimelineExcelReportRow[] {
  const counters: number[] = []
  const wbsForDepth = (depth: number): string => {
    while (counters.length <= depth) counters.push(0)
    counters[depth] += 1
    counters.length = depth + 1
    return counters.map(String).join('.')
  }

  return rows
    .filter((row) => row.kind !== 'add')
    .map((row) => {
      const planStart = toExcelDateOnly(row.startDate)
      const planEnd = toExcelDateOnly(row.endDate)
      const isLeaf = row.kind === 'task' || row.kind === 'milestone'
      const owner =
        row.assigneeUserId != null
          ? opts.personLabelFor(row.assigneeUserId)
          : isLeaf
            ? 'Unassigned'
            : '—'
      const reportStatus = deriveReportWorkStatus({
        itemType: row.itemType,
        scheduleStatus: row.scheduleStatus,
        planStart,
        planEnd,
        progressPercent: row.progressPercent,
        taskStatus: row.status,
        atRisk: row.atRisk,
      })
      const varianceDays = computeVarianceDays({
        reportStatus,
        planStart,
        planEnd,
      })
      const isMilestone =
        row.kind === 'milestone' ||
        row.itemType === 'MILESTONE' ||
        row.wbsNodeType === 'MILESTONE'
      const project = isLeaf
        ? opts.projectNameForTask(row.sourceEntityId) ?? ''
        : ''

      return {
        wbs: wbsForDepth(row.depth),
        workItem: project
          ? `${row.displayPrimary || row.title} (${project})`
          : row.displayPrimary || row.title,
        typeLabel: ganttItemTypeLabel(row.itemType),
        itemType: (row.itemType ?? '').toUpperCase(),
        owner,
        reportStatus,
        statusLabel: REPORT_STATUS_LABEL[reportStatus],
        planStart,
        planEnd,
        dueDate: planEnd,
        progressPercent:
          row.progressPercent != null ? Math.round(row.progressPercent) : null,
        varianceDays,
        isMilestone,
        isLeafWork: isLeaf,
        depth: row.depth,
        raw: {
          ganttItemId: row.id,
          sourceEntityId: row.sourceEntityId ?? '',
          phaseId: row.phaseId ?? '',
          wbsNodeId: '',
          assigneeUserId: row.assigneeUserId ?? '',
          scheduleStatus: row.scheduleStatus ?? '',
          parentItemId: row.parentPhaseSourceId ?? '',
        },
      }
    })
}

/**
 * Team Schedule → same decision-support Excel shape as Project Timeline.
 */
export async function downloadTeamScheduleExcel(
  rows: TimelineFlatRow[],
  opts: TeamScheduleExcelOptions
): Promise<void> {
  const reportRows = mapToReportRows(rows, opts)
  const insights = buildTimelineExcelOverviewInsights(reportRows)

  const scheduleRows: ScheduleReportExcelRow[] = reportRows.map((r) => ({
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

  await downloadScheduleReportWorkbook(scheduleRows, {
    fileName: opts.fileName,
    fileNameFallback: 'team-schedule',
    overview: {
      title: opts.workspaceName
        ? `Team Schedule · ${opts.workspaceName}`
        : 'Team Schedule',
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
        { label: 'Upcoming (14d)', value: insights.upcoming14Count },
      ],
      metaLines: [
        [
          'Project span',
          insights.projectStart && insights.projectEnd
            ? `${formatExcelDisplayDate(insights.projectStart)} – ${formatExcelDisplayDate(
                insights.projectEnd
              )}`
            : '—',
        ],
      ],
      lists: [
        {
          title: 'Overdue',
          headers: ['WBS', 'Work item', 'Plan end', 'Late by'],
          rows: insights.overdueItems.map((i) => [
            i.wbs,
            i.title,
            formatExcelDisplayDate(i.planEnd),
            i.varianceDays != null ? `${i.varianceDays}d` : '—',
          ]),
        },
        {
          title: 'Workload by person',
          headers: ['Owner', 'Items'],
          rows: insights.workloadByOwner.map((w) => [w.owner, w.count]),
        },
      ],
    },
  })
}
