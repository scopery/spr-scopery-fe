import type { PhaseWatchFollowUpKind, PhaseWatchSignal } from '../enums/phase-watch.enum'

export interface PhaseWatchUnassignedTask {
  taskId: string
  code: string
  title: string
  dueDate: string | null
  estimateHours: number | null
  priority: string
  phaseId: string | null
  phaseName: string | null
}

export interface PhaseWatchPhaseSummary {
  phaseId: string
  code: string
  name: string
  status: string
  statusLabel: string
  displayOrder: number
  plannedStartDate: string | null
  plannedEndDate: string | null
  progressPercent: number | null
  taskCount: number
  completedTaskCount: number
  blockedTaskCount: number
  unassignedTaskCount: number
}

export interface PhaseWatchProjectRow {
  projectId: string
  projectName: string
  projectCode: string | null
  activePhases: PhaseWatchPhaseSummary[]
  nextPhase: PhaseWatchPhaseSummary | null
  signals: PhaseWatchSignal[]
  primarySignal: PhaseWatchSignal
  followUpLabels: string[]
  unassignedTaskCount: number
  topUnassignedTasks: PhaseWatchUnassignedTask[]
}

export interface PhaseWatchFilterState {
  kind: PhaseWatchFollowUpKind | string
}
