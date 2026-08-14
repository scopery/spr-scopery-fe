import { describe, expect, it } from 'vitest'
import { TaskPriority, TaskStatus } from '../../../project/domain/enums/project.enum'
import { compareTasksForWorkQueue } from './task.rules'

function task(partial: {
  status: string
  dueDate: string | null
  priority?: string
}) {
  return {
    status: partial.status,
    dueDate: partial.dueDate,
    priority: partial.priority ?? TaskPriority.Medium,
  }
}

describe('compareTasksForWorkQueue', () => {
  it('puts overdue tasks before on-time tasks', () => {
    const overdue = task({ status: TaskStatus.Todo, dueDate: '2020-01-01' })
    const later = task({ status: TaskStatus.Todo, dueDate: '2099-01-01' })
    expect(compareTasksForWorkQueue(overdue, later)).toBeLessThan(0)
  })

  it('puts blocked before in progress when neither is overdue', () => {
    const blocked = task({ status: TaskStatus.Blocked, dueDate: null })
    const inProgress = task({ status: TaskStatus.InProgress, dueDate: null })
    expect(compareTasksForWorkQueue(blocked, inProgress)).toBeLessThan(0)
  })
})
