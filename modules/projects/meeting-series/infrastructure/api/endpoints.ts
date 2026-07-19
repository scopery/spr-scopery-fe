import { apiPath } from '@/shared/lib/api-paths'

export const MEETING_SERIES_ENDPOINTS = {
  list: (projectId: string) => apiPath(`/projects/${projectId}/meeting-series`),
  create: (projectId: string) => apiPath(`/projects/${projectId}/meeting-series`),
  get: (projectId: string, seriesId: string) =>
    apiPath(`/projects/${projectId}/meeting-series/${seriesId}`),
  update: (projectId: string, seriesId: string) =>
    apiPath(`/projects/${projectId}/meeting-series/${seriesId}`),
  pause: (projectId: string, seriesId: string) =>
    apiPath(`/projects/${projectId}/meeting-series/${seriesId}/pause`),
  archive: (projectId: string, seriesId: string) =>
    apiPath(`/projects/${projectId}/meeting-series/${seriesId}/archive`),
} as const
