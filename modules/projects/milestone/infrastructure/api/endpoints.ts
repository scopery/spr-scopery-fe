import { apiPath } from '@/shared/lib/api-paths'

export const MILESTONE_ENDPOINTS = {
  list: (projectId: string) => apiPath(`/projects/${projectId}/milestones`),
  create: (projectId: string) => apiPath(`/projects/${projectId}/milestones`),
  get: (projectId: string, milestoneId: string) =>
    apiPath(`/projects/${projectId}/milestones/${milestoneId}`),
  update: (projectId: string, milestoneId: string) =>
    apiPath(`/projects/${projectId}/milestones/${milestoneId}`),
  achieve: (projectId: string, milestoneId: string) =>
    apiPath(`/projects/${projectId}/milestones/${milestoneId}/achieve`),
  archive: (projectId: string, milestoneId: string) =>
    apiPath(`/projects/${projectId}/milestones/${milestoneId}/archive`),
} as const
