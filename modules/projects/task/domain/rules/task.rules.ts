import { TaskStatus } from '../../../project/domain/enums/project.enum'

export type TaskLifecycleAction = 'start' | 'block' | 'complete' | 'cancel' | 'archive' | 'reopen'

/** Target board statuses that can be reached via lifecycle PATCH (no reverse). */
export type TaskBoardStatus =
  | typeof TaskStatus.Todo
  | typeof TaskStatus.InProgress
  | typeof TaskStatus.Blocked
  | typeof TaskStatus.Completed

const ALLOWED: Record<string, TaskLifecycleAction[]> = {
  [TaskStatus.Todo]: ['start', 'cancel', 'archive'],
  [TaskStatus.InProgress]: ['block', 'complete', 'cancel', 'archive'],
  [TaskStatus.Blocked]: ['start', 'cancel', 'archive'],
  [TaskStatus.Completed]: ['reopen', 'archive'],
  [TaskStatus.Cancelled]: ['reopen', 'archive'],
  [TaskStatus.Archived]: [],
}

/** Board drop: fromStatus → toStatus → lifecycle action (or null if illegal). */
const BOARD_TRANSITION: Partial<
  Record<string, Partial<Record<string, TaskLifecycleAction>>>
> = {
  [TaskStatus.Todo]: {
    [TaskStatus.InProgress]: 'start',
  },
  [TaskStatus.InProgress]: {
    [TaskStatus.Blocked]: 'block',
    [TaskStatus.Completed]: 'complete',
  },
  [TaskStatus.Blocked]: {
    [TaskStatus.InProgress]: 'start',
  },
}

export function allowedTaskLifecycleActions(status: string): TaskLifecycleAction[] {
  return ALLOWED[status] ?? []
}

export function canRunTaskLifecycle(status: string, action: TaskLifecycleAction): boolean {
  return allowedTaskLifecycleActions(status).includes(action)
}

export function taskLifecycleActionForBoardMove(
  fromStatus: string,
  toStatus: string
): TaskLifecycleAction | null {
  if (fromStatus === toStatus) return null
  return BOARD_TRANSITION[fromStatus]?.[toStatus] ?? null
}

export function isTaskClosed(status: string | null | undefined): boolean {
  const s = (status ?? '').toUpperCase()
  return (
    s === TaskStatus.Completed ||
    s === 'COMPLETED' ||
    s === TaskStatus.Cancelled ||
    s === TaskStatus.Archived
  )
}

/** Closed tasks (done / cancelled / archived) cannot be reassigned. */
export function canAssignTask(status: string | null | undefined): boolean {
  return !isTaskClosed(status)
}

export function isTaskOverdue(task: {
  status: string
  dueDate: string | null
}): boolean {
  if (!task.dueDate) return false
  if (isTaskClosed(task.status)) {
    return false
  }
  const due = new Date(task.dueDate)
  if (Number.isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export function taskStatusLabel(status: string): string {
  switch (status) {
    case TaskStatus.Todo:
      return 'To do'
    case TaskStatus.InProgress:
      return 'In progress'
    case TaskStatus.Blocked:
      return 'Blocked'
    case TaskStatus.Completed:
    case 'COMPLETED':
      return 'Completed'
    case TaskStatus.Cancelled:
      return 'Cancelled'
    case TaskStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function taskPriorityLabel(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'Low'
    case 'MEDIUM':
      return 'Medium'
    case 'HIGH':
      return 'High'
    case 'CRITICAL':
      return 'Critical'
    default:
      return priority
  }
}

export const BOARD_COLUMNS: { status: TaskBoardStatus; label: string }[] = [
  { status: TaskStatus.Todo, label: 'To do' },
  { status: TaskStatus.InProgress, label: 'In progress' },
  { status: TaskStatus.Blocked, label: 'Blocked' },
  { status: TaskStatus.Completed, label: 'Completed' },
]
