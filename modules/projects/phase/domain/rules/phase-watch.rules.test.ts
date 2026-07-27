import { describe, expect, it } from 'vitest'
import { ProjectPhaseStatus, TaskStatus } from '../../../project/domain/enums/project.enum'
import type { ProjectPhase } from '../model/phase'
import type { ProjectTask } from '../../../task/domain/model/task'
import {
  buildProjectPhaseWatchRow,
  selectCurrentPhases,
  selectNextPhase,
} from './phase-watch.rules'
import { PhaseWatchSignal } from '../enums/phase-watch.enum'

function phase(partial: Partial<ProjectPhase> & Pick<ProjectPhase, 'id' | 'name' | 'displayOrder' | 'status'>): ProjectPhase {
  return {
    projectId: 'p1',
    phaseDefinitionId: null,
    code: partial.code ?? `PH-${partial.displayOrder}`,
    description: null,
    plannedStartDate: null,
    plannedEndDate: null,
    startedAt: null,
    completedAt: null,
    archivedAt: null,
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

function task(partial: Partial<ProjectTask> & Pick<ProjectTask, 'id' | 'projectPhaseId' | 'status'>): ProjectTask {
  return {
    projectId: 'p1',
    wbsNodeId: null,
    code: 'T-1',
    title: 'Task',
    description: null,
    inChargeUserId: null,
    plannedRoleCode: null,
    plannedRoleName: null,
    estimateHours: 1,
    plannedStartDate: null,
    dueDate: null,
    priority: 'MEDIUM',
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
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...partial,
  }
}

describe('phase-watch.rules', () => {
  it('selects all overlapping phases that contain today', () => {
    const phases = [
      phase({
        id: 'a',
        name: 'A',
        displayOrder: 1,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-07-01',
        plannedEndDate: '2026-08-15',
      }),
      phase({
        id: 'b',
        name: 'B',
        displayOrder: 2,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-08-01',
        plannedEndDate: '2026-08-20',
      }),
      phase({
        id: 'c',
        name: 'C',
        displayOrder: 3,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-09-01',
        plannedEndDate: '2026-09-30',
      }),
    ]
    expect(selectCurrentPhases(phases, '2026-08-05').map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('keeps both phases that start on the same day when today is inside both windows', () => {
    const phases = [
      phase({
        id: 'a',
        name: 'A',
        displayOrder: 1,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-08-01',
        plannedEndDate: '2026-08-31',
      }),
      phase({
        id: 'b',
        name: 'B',
        displayOrder: 2,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-08-01',
        plannedEndDate: '2026-09-15',
      }),
    ]
    expect(selectCurrentPhases(phases, '2026-08-10').map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('falls back to lifecycle ACTIVE when no calendar window matches', () => {
    const phases = [
      phase({ id: 'a', name: 'A', displayOrder: 1, status: ProjectPhaseStatus.Active }),
      phase({
        id: 'b',
        name: 'B',
        displayOrder: 2,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-09-01',
        plannedEndDate: '2026-09-30',
      }),
    ]
    expect(selectCurrentPhases(phases, '2026-08-05').map((p) => p.id)).toEqual(['a'])
  })

  it('picks next phase by earliest planned start after today', () => {
    const phases = [
      phase({
        id: 'a',
        name: 'Current',
        displayOrder: 1,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-07-01',
        plannedEndDate: '2026-08-10',
      }),
      phase({
        id: 'n2',
        name: 'Later',
        displayOrder: 3,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-08-20',
      }),
      phase({
        id: 'n1',
        name: 'Soon',
        displayOrder: 2,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-08-12',
      }),
    ]
    expect(selectNextPhase(phases, '2026-08-05')?.id).toBe('n1')
  })

  it('builds follow-up signals from blocked and unassigned tasks', () => {
    const phases = [
      phase({
        id: 'a',
        name: 'Active',
        displayOrder: 1,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-07-01',
        plannedEndDate: '2026-08-31',
      }),
      phase({
        id: 'n',
        name: 'Next',
        displayOrder: 2,
        status: ProjectPhaseStatus.Draft,
        plannedStartDate: '2026-08-05',
      }),
    ]
    const tasks = [
      task({ id: 't1', projectPhaseId: 'a', status: TaskStatus.Blocked }),
      task({ id: 't2', projectPhaseId: 'a', status: TaskStatus.Completed }),
      task({ id: 't3', projectPhaseId: 'n', status: TaskStatus.Todo, inChargeUserId: null }),
    ]
    const row = buildProjectPhaseWatchRow({
      projectId: 'p1',
      projectName: 'Demo',
      phases,
      tasks,
      todayIso: '2026-08-01',
    })
    expect(row.activePhases[0].progressPercent).toBe(50)
    expect(row.signals).toContain(PhaseWatchSignal.HasBlockers)
    expect(row.signals).toContain(PhaseWatchSignal.StartingSoon)
    expect(row.signals).toContain(PhaseWatchSignal.UnassignedTasks)
    expect(row.primarySignal).toBe(PhaseWatchSignal.HasBlockers)
  })
})
