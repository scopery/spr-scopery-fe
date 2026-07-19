export const QualityPlanStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type QualityPlanStatus = (typeof QualityPlanStatus)[keyof typeof QualityPlanStatus]

export const DefectStatus = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Closed: 'CLOSED',
} as const
export type DefectStatus = (typeof DefectStatus)[keyof typeof DefectStatus]

export const ReleaseStatus = {
  Planned: 'PLANNED',
  Ready: 'READY',
  Released: 'RELEASED',
} as const
export type ReleaseStatus = (typeof ReleaseStatus)[keyof typeof ReleaseStatus]
