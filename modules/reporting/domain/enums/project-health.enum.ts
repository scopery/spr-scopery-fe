export const ProjectHealthStatus = {
  OnTrack: 'ON_TRACK',
  NeedsAttention: 'NEEDS_ATTENTION',
  AtRisk: 'AT_RISK',
  OffTrack: 'OFF_TRACK',
  InsufficientData: 'INSUFFICIENT_DATA',
} as const
export type ProjectHealthStatus =
  (typeof ProjectHealthStatus)[keyof typeof ProjectHealthStatus]

export const AttentionSeverity = {
  High: 'HIGH',
  Medium: 'MEDIUM',
  Low: 'LOW',
} as const
export type AttentionSeverity =
  (typeof AttentionSeverity)[keyof typeof AttentionSeverity]

export const FinancePermissionState = {
  Allowed: 'ALLOWED',
  Masked: 'MASKED',
  Unavailable: 'UNAVAILABLE',
} as const
export type FinancePermissionState =
  (typeof FinancePermissionState)[keyof typeof FinancePermissionState]
