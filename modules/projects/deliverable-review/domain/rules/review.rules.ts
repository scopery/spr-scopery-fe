import type { DeliverableReview } from '../model/review'
import { ReviewStatus } from '../enums/review.enum'

export function canApproveReview(review: DeliverableReview): boolean {
  return review.status === ReviewStatus.Pending
}

export function canRejectReview(review: DeliverableReview): boolean {
  return review.status === ReviewStatus.Pending
}

export function canRequestRework(review: DeliverableReview): boolean {
  return review.status === ReviewStatus.Pending
}

export function reviewStatusLabel(status: string): string {
  switch (status) {
    case ReviewStatus.Pending:
      return 'Pending'
    case ReviewStatus.Approved:
      return 'Approved'
    case ReviewStatus.Rejected:
      return 'Rejected'
    case ReviewStatus.ReworkRequested:
      return 'Rework Requested'
    default:
      return status
  }
}

export function reviewStatusTone(status: string): 'success' | 'error' | 'warning' | 'neutral' {
  switch (status) {
    case ReviewStatus.Approved:
      return 'success'
    case ReviewStatus.Rejected:
      return 'error'
    case ReviewStatus.ReworkRequested:
      return 'warning'
    case ReviewStatus.Pending:
    default:
      return 'neutral'
  }
}
