import { TaskStatus } from '../../../../project/domain/enums/project.enum'
import { taskStatusLabel } from '../../../domain/rules/task.rules'
import { WORK_INSIGHT_STATUS_ORDER } from '../../../domain/rules/work-items-insights.rules'
import type { WorkInsightStackRow } from '../../../domain/rules/work-items-insights.rules'

export const STATUS_FILL: Record<string, string> = {
  [TaskStatus.Todo]: 'var(--color-neutral-400)',
  [TaskStatus.InProgress]: 'var(--color-progress)',
  [TaskStatus.Blocked]: 'var(--color-warning)',
  [TaskStatus.Completed]: 'var(--color-success)',
  [TaskStatus.Cancelled]: 'var(--color-neutral-600)',
  [TaskStatus.Archived]: 'var(--color-neutral-300)',
}

export function statusFill(status: string): string {
  return STATUS_FILL[status] ?? 'var(--color-neutral-400)'
}

export function stackedStatusKeys(rows: WorkInsightStackRow[]): string[] {
  const present = new Set<string>()
  for (const row of rows) {
    for (const [status, count] of Object.entries(row.counts)) {
      if (count > 0) present.add(status)
    }
  }
  return WORK_INSIGHT_STATUS_ORDER.filter((status) => present.has(status))
}

export function toStackedChartRows(rows: WorkInsightStackRow[], statusKeys: string[]) {
  return rows.map((row) => {
    const next: Record<string, string | number> = { key: row.key, label: row.label, total: row.total }
    for (const status of statusKeys) {
      next[status] = row.counts[status] ?? 0
    }
    return next
  })
}

export function statusLegend(statusKeys: string[]) {
  return statusKeys.map((status) => ({
    status,
    label: taskStatusLabel(status),
    fill: statusFill(status),
  }))
}
