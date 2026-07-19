import { apiPath } from '@/shared/lib/api-paths'
import type { ProjectReportKey } from '../../domain/model/reports'

/**
 * Project Reports
 * Description: Scope + RAID reporting endpoints. Response shape varies per report
 * (flat list or aggregate map) so consumers treat the payload as raw JSON.
 * Base: /api/projects/{projectId}/reports/*
 */
export const REPORT_ENDPOINTS = {
  get: (projectId: string, reportKey: ProjectReportKey) =>
    apiPath(`/projects/${projectId}/reports/${reportKey}`),
} as const
