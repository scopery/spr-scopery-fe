export const PrivacyRequestStatus = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
} as const
export type PrivacyRequestStatus =
  (typeof PrivacyRequestStatus)[keyof typeof PrivacyRequestStatus]
