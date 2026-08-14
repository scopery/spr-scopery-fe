import { TaskPriority, TaskStatus } from '../../../project/domain/enums/project.enum'
import type { ProjectTask } from '../model/task'
import { isTaskClosed, isTaskOverdue, taskPriorityLabel, taskStatusLabel } from './task.rules'

export const WORK_INSIGHT_STATUS_ORDER = [
  TaskStatus.Todo,
  TaskStatus.InProgress,
  TaskStatus.Blocked,
  TaskStatus.Completed,
  TaskStatus.Cancelled,
  TaskStatus.Archived,
] as const

export interface WorkInsightBar {
  key: string
  label: string
  count: number
  tone: 'neutral' | 'info' | 'warning' | 'error' | 'success' | 'progress'
}

export interface WorkInsightStackRow {
  key: string
  label: string
  total: number
  counts: Record<string, number>
}

export interface WorkItemsInsights {
  total: number
  overdue: number
  blocked: number
  unassigned: number
  done: number
  byStatus: WorkInsightBar[]
  byMember: WorkInsightStackRow[]
  byPhase: WorkInsightStackRow[]
  byPriority: WorkInsightStackRow[]
}

export interface WorkItemsInsightLabels {
  phaseNameById: ReadonlyMap<string, string>
  assigneeNameById: ReadonlyMap<string, string>
}

const STATUS_TONE: Record<string, WorkInsightBar['tone']> = {
  [TaskStatus.Todo]: 'neutral',
  [TaskStatus.InProgress]: 'progress',
  [TaskStatus.Blocked]: 'warning',
  [TaskStatus.Completed]: 'success',
  [TaskStatus.Cancelled]: 'neutral',
  [TaskStatus.Archived]: 'neutral',
}

function countBy(
  items: ProjectTask[],
  keyOf: (task: ProjectTask) => string
): Map<string, number> {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = keyOf(item)
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return map
}

function stackBy(
  tasks: ProjectTask[],
  categoryOf: (task: ProjectTask) => { key: string; label: string }
): WorkInsightStackRow[] {
  const map = new Map<string, WorkInsightStackRow>()
  for (const task of tasks) {
    const { key, label } = categoryOf(task)
    let row = map.get(key)
    if (!row) {
      row = { key, label, total: 0, counts: {} }
      map.set(key, row)
    }
    row.total += 1
    row.counts[task.status] = (row.counts[task.status] ?? 0) + 1
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
}

export function buildWorkItemsInsights(
  tasks: ProjectTask[],
  labels: WorkItemsInsightLabels
): WorkItemsInsights {
  const byStatusCounts = countBy(tasks, (t) => t.status)
  const { phaseNameById, assigneeNameById } = labels

  const priorityOrder = [
    TaskPriority.Critical,
    TaskPriority.High,
    TaskPriority.Medium,
    TaskPriority.Low,
  ]

  const byPriority = stackBy(tasks, (t) => ({
    key: t.priority,
    label: taskPriorityLabel(t.priority),
  }))
  const priorityIndex = new Map(priorityOrder.map((p, i) => [p, i]))

  return {
    total: tasks.length,
    overdue: tasks.filter(isTaskOverdue).length,
    blocked: tasks.filter((t) => t.status === TaskStatus.Blocked).length,
    unassigned: tasks.filter((t) => !t.inChargeUserId).length,
    done: tasks.filter((t) => isTaskClosed(t.status)).length,
    byStatus: WORK_INSIGHT_STATUS_ORDER.map((status) => ({
      key: status,
      label: taskStatusLabel(status),
      count: byStatusCounts.get(status) ?? 0,
      tone: STATUS_TONE[status] ?? 'neutral',
    })).filter((row) => row.count > 0),
    byMember: stackBy(tasks, (t) => {
      const id = t.inChargeUserId ?? ''
      return {
        key: id || 'unassigned',
        label: id ? (assigneeNameById.get(id) ?? 'Unknown') : 'Unassigned',
      }
    }),
    byPhase: stackBy(tasks, (t) => {
      const id = t.projectPhaseId ?? ''
      return {
        key: id || 'none',
        label: id ? (phaseNameById.get(id) ?? 'Unknown phase') : 'No phase',
      }
    }),
    byPriority: byPriority.sort(
      (a, b) => (priorityIndex.get(a.key as TaskPriority) ?? 99) - (priorityIndex.get(b.key as TaskPriority) ?? 99)
    ),
  }
}
