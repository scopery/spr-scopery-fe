import { ProjectStatus } from '../enums/project.enum'

export type ProjectLifecycleAction = 'activate' | 'hold' | 'complete' | 'archive'

const ALLOWED: Record<string, ProjectLifecycleAction[]> = {
  [ProjectStatus.Draft]: ['activate', 'archive'],
  [ProjectStatus.Active]: ['hold', 'complete', 'archive'],
  [ProjectStatus.OnHold]: ['activate', 'complete', 'archive'],
  [ProjectStatus.Completed]: ['archive'],
  [ProjectStatus.Archived]: [],
}

export function allowedProjectLifecycleActions(status: string): ProjectLifecycleAction[] {
  return ALLOWED[status] ?? []
}

export function canRunProjectLifecycle(
  status: string,
  action: ProjectLifecycleAction
): boolean {
  return allowedProjectLifecycleActions(status).includes(action)
}

export function projectStatusLabel(status: string): string {
  switch (status) {
    case ProjectStatus.Draft:
      return 'Draft'
    case ProjectStatus.Active:
      return 'Active'
    case ProjectStatus.OnHold:
      return 'On hold'
    case ProjectStatus.Completed:
      return 'Completed'
    case ProjectStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function projectStatusTone(
  status: string
): 'success' | 'warning' | 'neutral' | 'error' | 'info' {
  switch (status) {
    case ProjectStatus.Active:
      return 'success'
    case ProjectStatus.OnHold:
      return 'warning'
    case ProjectStatus.Completed:
      return 'info'
    case ProjectStatus.Archived:
      return 'neutral'
    default:
      return 'neutral'
  }
}
