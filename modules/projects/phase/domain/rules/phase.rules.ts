import { ProjectPhaseStatus } from '../../../project/domain/enums/project.enum'

export type PhaseLifecycleAction = 'activate' | 'complete' | 'archive'

const ALLOWED: Record<string, PhaseLifecycleAction[]> = {
  [ProjectPhaseStatus.Draft]: ['activate', 'archive'],
  [ProjectPhaseStatus.Active]: ['complete', 'archive'],
  [ProjectPhaseStatus.Completed]: ['archive'],
  [ProjectPhaseStatus.Archived]: [],
}

export function allowedPhaseLifecycleActions(status: string): PhaseLifecycleAction[] {
  return ALLOWED[status] ?? []
}

export function canRunPhaseLifecycle(status: string, action: PhaseLifecycleAction): boolean {
  return allowedPhaseLifecycleActions(status).includes(action)
}

export function phaseStatusLabel(status: string): string {
  switch (status) {
    case ProjectPhaseStatus.Draft:
      return 'Draft'
    case ProjectPhaseStatus.Active:
      return 'Active'
    case ProjectPhaseStatus.Completed:
      return 'Completed'
    case ProjectPhaseStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}
