export const SupportCaseStatus = {
  New: 'NEW',
  Triaged: 'TRIAGED',
  InProgress: 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Closed: 'CLOSED',
} as const
export type SupportCaseStatus =
  (typeof SupportCaseStatus)[keyof typeof SupportCaseStatus]
