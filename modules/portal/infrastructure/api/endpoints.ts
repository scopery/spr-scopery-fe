import { apiPath } from '@/shared/lib/api-paths'

export const PORTAL_ENDPOINTS = {
  login: () => apiPath('/portal/auth/login'),
  projects: () => apiPath('/portal/projects'),
  project: (projectId: string) => apiPath(`/portal/projects/${projectId}`),
  reviews: (projectId: string) => apiPath(`/portal/projects/${projectId}/reviews`),
  decideReview: (projectId: string, reviewId: string) =>
    apiPath(`/portal/projects/${projectId}/reviews/${reviewId}/decide`),
  meetings: (projectId: string) => apiPath(`/portal/projects/${projectId}/meetings`),
  forms: (projectId: string) => apiPath(`/portal/projects/${projectId}/forms`),
  feedback: (projectId: string) => apiPath(`/portal/projects/${projectId}/feedback`),
  support: (projectId: string) => apiPath(`/portal/projects/${projectId}/support`),
} as const
