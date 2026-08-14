import { TaskPriority, TaskStatus } from '../../../project/domain/enums/project.enum'
import type { ProjectTask } from '../model/task'
import { isTaskClosed, isTaskOverdue, taskPriorityLabel, taskStatusLabel } from './task.rules'

export interface WorkInsightBar {
  key: string
  label: string
  count: number
  tone: 'neutral' | 'info' | 'warning' | 'error' | 'success' | 'progress'
}

export interface WorkItemsInsights {
  total: number
  overdue: number
  blocked: number
  unassigned: number
  done: number
  byStatus: WorkInsightBar[]
  byPriority: WorkInsightBar[]
  byPhase: WorkInsightBar[]
}

const STATUS_TONE: Record<string, WorkInsightBar['tone']> = {
  [TaskStatus.Todo]: 'neutral',
  [TaskStatus.InProgress]: 'progress',
  [TaskStatus.Blocked]: 'warning',
  [TaskStatus.Completed]: 'success',
  [TaskStatus.Cancelled]: 'neutral',
  [TaskStatus.Archived]: 'neutral',
}

const PRIORITY_TONE: Record<string, WorkInsightBar['tone']> = {
  [TaskPriority.Critical]: 'error',
  [TaskPriority.High]: 'warning',
  [TaskPriority.Medium]: 'info',
  [TaskPriority.Low]: 'neutral',
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

export function buildWorkItemsInsights(
  tasks: ProjectTask[],
  phaseNameById: ReadonlyMap<string, string>
): WorkItemsInsights {
  const byStatusCounts = countBy(tasks, (t) => t.status)
  const byPriorityCounts = countBy(tasks, (t) => t.priority)
  const byPhaseCounts = countBy(tasks, (t) => t.projectPhaseId ?? '')

  const statusOrder = [
    TaskStatus.Todo,
    TaskStatus.InProgress,
    TaskStatus.Blocked,
    TaskStatus.Completed,
    TaskStatus.Cancelled,
    TaskStatus.Archived,
  ]

  const priorityOrder = [
    TaskPriority.Critical,
    TaskPriority.High,
    TaskPriority.Medium,
    TaskPriority.Low,
  ]

  return {
    total: tasks.length,
    overdue: tasks.filter(isTaskOverdue).length,
    blocked: tasks.filter((t) => t.status === TaskStatus.Blocked).length,
    unassigned: tasks.filter((t) => !t.inChargeUserId).length,
    done: tasks.filter((t) => isTaskClosed(t.status)).length,
    byStatus: statusOrder
      .map((status) => ({
        key: status,
        label: taskStatusLabel(status),
        count: byStatusCounts.get(status) ?? 0,
        tone: STATUS_TONE[status] ?? 'neutral',
      }))
      .filter((row) => row.count > 0),
    byPriority: priorityOrder
      .map((priority) => ({
        key: priority,
        label: taskPriorityLabel(priority),
        count: byPriorityCounts.get(priority) ?? 0,
        tone: PRIORITY_TONE[priority] ?? 'neutral',
      }))
      .filter((row) => row.count > 0),
    byPhase: [...byPhaseCounts.entries()]
      .map(([id, count]) => ({
        key: id || 'none',
        label: id ? (phaseNameById.get(id) ?? 'Unknown phase') : 'No phase',
        count,
        tone: 'info' as const,
      }))
      .sort((a, b) => b.count - a.count),
  }
}
