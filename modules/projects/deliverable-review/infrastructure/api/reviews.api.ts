import { apiClient } from '@/shared/lib/apiClient'
import { REVIEW_ENDPOINTS } from './endpoints'
import type { DeliverableReview } from '../../domain/model/review'

export async function submitDeliverableForReview(
  projectId: string,
  deliverableId: string,
  body?: { comment?: string }
): Promise<DeliverableReview> {
  return apiClient.post<DeliverableReview>(
    REVIEW_ENDPOINTS.submitReview(projectId, deliverableId),
    body ?? {}
  )
}

export async function approveReview(
  projectId: string,
  reviewId: string,
  body?: { comment?: string }
): Promise<DeliverableReview> {
  return apiClient.post<DeliverableReview>(
    REVIEW_ENDPOINTS.approve(projectId, reviewId),
    body ?? {}
  )
}

export async function rejectReview(
  projectId: string,
  reviewId: string,
  body?: { comment?: string }
): Promise<DeliverableReview> {
  return apiClient.post<DeliverableReview>(
    REVIEW_ENDPOINTS.reject(projectId, reviewId),
    body ?? {}
  )
}

export async function requestRework(
  projectId: string,
  reviewId: string,
  body?: { comment?: string }
): Promise<DeliverableReview> {
  return apiClient.post<DeliverableReview>(
    REVIEW_ENDPOINTS.requestRework(projectId, reviewId),
    body ?? {}
  )
}
