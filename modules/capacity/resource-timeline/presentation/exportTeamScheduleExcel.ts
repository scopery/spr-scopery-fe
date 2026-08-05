import {
  TIMELINE_EXCEL_BAR_COLORS,
  downloadTimelineExcelWorkbook,
  toExcelDateOnly,
  type TimelineExcelListColumn,
  type TimelineExcelRow,
} from '@/shared/lib/excel'
import { ganttItemTypeLabel, type TimelineFlatRow } from '@/modules/projects/gantt'

const TEAM_LIST_COLUMNS: TimelineExcelListColumn[] = [
  { key: 'type', header: 'Type', width: 12 },
  { key: 'title', header: 'Title', width: 40 },
  { key: 'person', header: 'Person', width: 24 },
  { key: 'project', header: 'Project', width: 28 },
  { key: 'status', header: 'Schedule status', width: 16 },
  { key: 'start', header: 'Start date', width: 14 },
  { key: 'finish', header: 'Finish date', width: 14 },
  { key: 'duration', header: 'Duration (days)', width: 14 },
  { key: 'estimate', header: 'Estimate (h)', width: 12 },
]

function barFillForRow(row: TimelineFlatRow): string {
  const status = (row.scheduleStatus ?? '').toUpperCase()
  if (status === 'UNSCHEDULED') return TIMELINE_EXCEL_BAR_COLORS.unscheduled
  if (status === 'AT_RISK' || status === 'DELAYED') return TIMELINE_EXCEL_BAR_COLORS.atRisk
  if (!row.assigneeUserId && (row.kind === 'task' || row.kind === 'milestone')) {
    return TIMELINE_EXCEL_BAR_COLORS.unassigned
  }
  switch ((row.itemType ?? '').toUpperCase()) {
    case 'PROJECT':
      return TIMELINE_EXCEL_BAR_COLORS.project
    case 'PHASE':
      return TIMELINE_EXCEL_BAR_COLORS.phase
    case 'WBS_NODE':
      return row.wbsNodeType === 'MILESTONE'
        ? TIMELINE_EXCEL_BAR_COLORS.milestone
        : TIMELINE_EXCEL_BAR_COLORS.wbs
    case 'MILESTONE':
      return TIMELINE_EXCEL_BAR_COLORS.milestone
    case 'TASK':
    default:
      return TIMELINE_EXCEL_BAR_COLORS.task
  }
}

export interface TeamScheduleExcelOptions {
  workspaceName?: string | null
  fileName?: string
  personLabelFor: (userId: string) => string
  projectNameForTask: (sourceEntityId: string | null | undefined) => string | null
}

function mapRows(
  rows: TimelineFlatRow[],
  opts: TeamScheduleExcelOptions
): TimelineExcelRow[] {
  return rows
    .filter((row) => row.kind !== 'add')
    .map((row) => {
      const isMilestone =
        row.kind === 'milestone' ||
        row.itemType === 'MILESTONE' ||
        row.wbsNodeType === 'MILESTONE'
      const person =
        row.assigneeUserId != null
          ? opts.personLabelFor(row.assigneeUserId)
          : row.kind === 'task' || row.kind === 'milestone'
            ? 'Unassigned'
            : ''
      const project =
        row.kind === 'task' || row.kind === 'milestone'
          ? opts.projectNameForTask(row.sourceEntityId) ?? ''
          : ''

      return {
        typeLabel: ganttItemTypeLabel(row.itemType),
        title: row.displayPrimary || row.title,
        depth: row.depth,
        scheduleStatus: row.scheduleStatus,
        startDate: toExcelDateOnly(row.startDate),
        endDate: toExcelDateOnly(row.endDate),
        fillHex: barFillForRow(row),
        isMilestone,
        cells: {
          person,
          project,
          estimate: row.estimateHours ?? '',
        },
      }
    })
}

/**
 * Team Schedule → Excel (same shared style as Project Timeline).
 * Change look-and-feel in `@/shared/lib/excel/style.ts`.
 */
export async function downloadTeamScheduleExcel(
  rows: TimelineFlatRow[],
  opts: TeamScheduleExcelOptions
): Promise<void> {
  const excelRows = mapRows(rows, opts)
  const leafTasks = excelRows.filter(
    (r) => r.typeLabel === 'Task' || r.typeLabel === 'Milestone'
  )
  const unassigned = leafTasks.filter((r) => r.cells?.person === 'Unassigned')

  await downloadTimelineExcelWorkbook(excelRows, {
    title: opts.workspaceName ? `Team Schedule · ${opts.workspaceName}` : 'Team Schedule',
    fileName: opts.fileName,
    fileNameFallback: 'team-schedule',
    listSheetName: 'Schedule',
    chartSheetName: 'Gantt',
    listColumns: TEAM_LIST_COLUMNS,
    summaryLines: [
      ['Tasks & milestones', leafTasks.length],
      ['Unassigned', unassigned.length],
    ],
  })
}
