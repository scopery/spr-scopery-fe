export const PortalReviewStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const
export type PortalReviewStatus =
  (typeof PortalReviewStatus)[keyof typeof PortalReviewStatus]
