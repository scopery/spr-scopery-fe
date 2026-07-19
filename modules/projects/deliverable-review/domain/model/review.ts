import type { ReviewStatus } from '../enums/review.enum'

export interface DeliverableReview {
  id: string
  projectId: string
  deliverableId: string
  status: ReviewStatus | string
  reviewerId: string | null
  submittedAt: string | null
  reviewedAt: string | null
  comment: string | null
}
