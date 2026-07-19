export const ReviewStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  ReworkRequested: 'REWORK_REQUESTED',
} as const

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus]
