export const JoinRequestStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
} as const
export type JoinRequestStatus = (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus]
