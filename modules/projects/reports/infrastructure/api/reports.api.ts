import { apiClient } from '@/shared/lib/apiClient'
import { REPORT_ENDPOINTS } from './endpoints'
import type { ProjectReportKey, ProjectReportResult } from '../../domain/model/reports'

export async function getProjectReport(
  projectId: string,
  reportKey: ProjectReportKey
): Promise<ProjectReportResult> {
  return apiClient.get<ProjectReportResult>(REPORT_ENDPOINTS.get(projectId, reportKey))
}
