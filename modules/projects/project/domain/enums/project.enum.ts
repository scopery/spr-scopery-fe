export const ProjectStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  OnHold: 'ON_HOLD',
  Completed: 'COMPLETED',
  Archived: 'ARCHIVED',
} as const
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus]

export const ProjectPhaseStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Completed: 'COMPLETED',
  Archived: 'ARCHIVED',
} as const
export type ProjectPhaseStatus = (typeof ProjectPhaseStatus)[keyof typeof ProjectPhaseStatus]

export const TaskStatus = {
  Todo: 'TODO',
  InProgress: 'IN_PROGRESS',
  Blocked: 'BLOCKED',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  Archived: 'ARCHIVED',
} as const
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus]

export const TaskPriority = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
  Critical: 'CRITICAL',
} as const
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority]
