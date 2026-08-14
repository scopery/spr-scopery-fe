import { describe, expect, it } from 'vitest'
import { TaskPriority, TaskStatus } from '../../../project/domain/enums/project.enum'
import type { ProjectTask } from '../model/task'
import { buildWorkItemsInsights } from './work-items-insights.rules'

function task(partial: Partial<ProjectTask> & Pick<ProjectTask, 'id'>): ProjectTask {
  return {
    projectId: 'p',
    projectPhaseId: null,
    wbsNodeId: null,
    code: partial.id,
    title: partial.id,
    description: null,
    inChargeUserId: null,
    plannedRoleCode: null,
    plannedRoleName: null,
    estimateHours: null,
    plannedStartDate: null,
    dueDate: null,
    priority: TaskPriority.Medium,
    status: TaskStatus.Todo,
    startedAt: null,
    startedBy: null,
    blockedAt: null,
    completedAt: null,
    completedBy: null,
    cancelledAt: null,
    cancelledBy: null,
    archivedAt: null,
    archivedBy: null,
    version: 1,
    createdAt: '',
    updatedAt: '',
    ...partial,
  }
}

describe('buildWorkItemsInsights', () => {
  it('counts overdue, blocked, and unassigned', () => {
    const insights = buildWorkItemsInsights(
      [
        task({ id: '1', status: TaskStatus.Blocked, dueDate: '2020-01-01' }),
        task({ id: '2', status: TaskStatus.Todo, inChargeUserId: 'u1' }),
        task({ id: '3', status: TaskStatus.Completed, dueDate: '2020-01-01' }),
      ],
      { phaseNameById: new Map(), assigneeNameById: new Map([['u1', 'Alex']]) }
    )
    expect(insights.total).toBe(3)
    expect(insights.blocked).toBe(1)
    expect(insights.overdue).toBe(1)
    expect(insights.unassigned).toBe(2)
    expect(insights.done).toBe(1)
    expect(insights.byMember.map((r) => r.label).sort()).toEqual(['Alex', 'Unassigned'])
    expect(insights.byPhase).toEqual([
      expect.objectContaining({ label: 'No phase', total: 3 }),
    ])
  })
})
