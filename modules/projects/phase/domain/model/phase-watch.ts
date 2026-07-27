import type { PhaseWatchFollowUpKind, PhaseWatchSignal } from '../enums/phase-watch.enum'

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
}

export interface PhaseWatchFilterState {
  kind: PhaseWatchFollowUpKind | string
}
