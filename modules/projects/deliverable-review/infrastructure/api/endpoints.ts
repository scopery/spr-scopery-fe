import { apiPath } from '@/shared/lib/api-paths'

export const REVIEW_ENDPOINTS = {
  submitReview: (projectId: string, deliverableId: string) =>
    apiPath(`/projects/${projectId}/deliverables/${deliverableId}/submit-review`),
  approve: (projectId: string, reviewId: string) =>
    apiPath(`/projects/${projectId}/reviews/${reviewId}/approve`),
  reject: (projectId: string, reviewId: string) =>
    apiPath(`/projects/${projectId}/reviews/${reviewId}/reject`),
  requestRework: (projectId: string, reviewId: string) =>
    apiPath(`/projects/${projectId}/reviews/${reviewId}/request-rework`),
} as const
