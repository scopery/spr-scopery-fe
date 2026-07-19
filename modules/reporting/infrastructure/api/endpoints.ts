import { apiPath } from '@/shared/lib/api-paths'

export const REPORTING_ENDPOINTS = {
  dashboard: (projectId: string) => apiPath(`/projects/${projectId}/dashboard`),
  definitions: () => apiPath('/reports/definitions'),
  run: () => apiPath('/reports/runs'),
  runStatus: (runId: string) => apiPath(`/reports/runs/${runId}`),
  runSnapshot: (runId: string) => apiPath(`/reports/runs/${runId}/snapshot`),
  runExport: (runId: string) => apiPath(`/reports/runs/${runId}/exports`),
  exports: (projectId: string) =>
    apiPath(`/reports/exports?projectId=${encodeURIComponent(projectId)}`),
  exportJob: (exportJobId: string) => apiPath(`/reports/exports/${exportJobId}`),
  exportDownload: (exportJobId: string) =>
    apiPath(`/reports/exports/${exportJobId}/download`),
  exportCancel: (exportJobId: string) =>
    apiPath(`/reports/exports/${exportJobId}/cancel`),
  projectReport: (projectId: string, reportKey: string) =>
    apiPath(`/projects/${projectId}/reports/${reportKey}`),
  activityFeed: (projectId: string, params?: { page?: number; size?: number }) => {
    const p = new URLSearchParams()
    if (params?.page != null) p.set('page', String(params.page))
    if (params?.size != null) p.set('size', String(params.size))
    const q = p.toString()
    return apiPath(`/projects/${projectId}/activity-feed`) + (q ? `?${q}` : '')
  },
} as const
