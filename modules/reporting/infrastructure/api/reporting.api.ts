import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { REPORTING_ENDPOINTS } from './endpoints'
import type {
  ProjectDashboardSummary,
  ReportDefinition,
  ReportExportJob,
  ReportRun,
} from '../../domain/model/report'

export async function getProjectDashboard(
  projectId: string
): Promise<ProjectDashboardSummary> {
  return apiClient.get(REPORTING_ENDPOINTS.dashboard(projectId))
}

async function getOptionalDashboardSlice(
  projectId: string,
  url: string
): Promise<Record<string, unknown> | null> {
  try {
    return await apiClient.get<Record<string, unknown>>(url, { skipErrorToast: true })
  } catch {
    return null
  }
}

export async function getProjectDashboardHealth(
  projectId: string
): Promise<Record<string, unknown> | null> {
  return getOptionalDashboardSlice(projectId, REPORTING_ENDPOINTS.dashboardHealth(projectId))
}

export async function getProjectDashboardKpis(
  projectId: string
): Promise<Record<string, unknown> | null> {
  return getOptionalDashboardSlice(projectId, REPORTING_ENDPOINTS.dashboardKpis(projectId))
}

export async function getProjectDashboardAttention(
  projectId: string
): Promise<Record<string, unknown> | null> {
  return getOptionalDashboardSlice(projectId, REPORTING_ENDPOINTS.dashboardAttention(projectId))
}

export async function listReportDefinitions(): Promise<{ items: ReportDefinition[] }> {
  const res = await apiClient.get<ListPayload<ReportDefinition>>(REPORTING_ENDPOINTS.definitions())
  return normalizeItemList(res)
}

export async function startReportRun(body: {
  reportCode: string
  projectId?: string
  filters?: Record<string, unknown>
  selectedFields?: string[]
}): Promise<ReportRun> {
  return apiClient.post(REPORTING_ENDPOINTS.run(), body)
}

export async function getReportRun(runId: string): Promise<ReportRun> {
  return apiClient.get(REPORTING_ENDPOINTS.runStatus(runId))
}

export async function requestRunExport(
  runId: string,
  body: { format: string; fileName?: string }
): Promise<ReportExportJob> {
  return apiClient.post(REPORTING_ENDPOINTS.runExport(runId), body)
}

export async function listExportJobs(
  projectId: string
): Promise<{ items: ReportExportJob[] }> {
  const res = await apiClient.get<ListPayload<ReportExportJob>>(REPORTING_ENDPOINTS.exports(projectId))
  return normalizeItemList(res)
}

export async function getExportJob(exportJobId: string): Promise<ReportExportJob> {
  return apiClient.get(REPORTING_ENDPOINTS.exportJob(exportJobId))
}

export async function cancelExportJob(exportJobId: string): Promise<void> {
  await apiClient.post(REPORTING_ENDPOINTS.exportCancel(exportJobId), undefined, {
    parseJson: false,
  })
}

/** Same-origin GET — browser sends auth cookies. */
export function openExportDownload(exportJobId: string): void {
  if (typeof window === 'undefined') return
  window.open(REPORTING_ENDPOINTS.exportDownload(exportJobId), '_blank', 'noopener,noreferrer')
}

export const PROJECT_REPORT_KEYS = [
  'task-risk',
  'schedule-risk',
  'capacity',
  'estimation',
  'finance',
  'quote',
  'baseline-vs-current',
  'change-impact',
  'notifications',
] as const

export async function getProjectReport(
  projectId: string,
  reportKey: string
): Promise<Record<string, unknown>> {
  return apiClient.get(REPORTING_ENDPOINTS.projectReport(projectId, reportKey), {
    skipErrorToast: true,
  })
}

export async function listActivityFeed(
  projectId: string
): Promise<{ items: Record<string, unknown>[] }> {
  const res = await apiClient.get<ListPayload<Record<string, unknown>>>(
    REPORTING_ENDPOINTS.activityFeed(projectId, { page: 0, size: 20 }),
    {
      // Feed is secondary on dashboard — avoid global toast when BE auth mis-resolves.
      skipErrorToast: true,
    }
  )
  return normalizeItemList(res)
}
