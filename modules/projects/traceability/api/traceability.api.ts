import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'

export const TRACEABILITY_ENDPOINTS = {
  coverageMatrix: (projectId: string) =>
    apiPath(`/projects/${projectId}/reports/coverage-matrix`),
  traceLinks: (projectId: string) => apiPath(`/projects/${projectId}/trace-links`),
  applications: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications`),
  createApplication: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications`),
} as const

export interface CoverageMatrixCell {
  requirementId: string
  requirementCode?: string
  requirementTitle?: string
  hasTestCase?: boolean
  hasResult?: boolean
  hasDefect?: boolean
  hasRelease?: boolean
  gap?: boolean
}

export interface TraceLink {
  id: string
  sourceType: string
  sourceId: string
  targetType: string
  targetId: string
  linkType: string
  status?: string
}

export interface ApplicationItem {
  id: string
  code?: string
  name: string
  status?: string
  description?: string | null
}

export async function getCoverageMatrix(
  projectId: string
): Promise<{ items: CoverageMatrixCell[] }> {
  const res = await apiClient.get<ListPayload<CoverageMatrixCell>>(TRACEABILITY_ENDPOINTS.coverageMatrix(projectId))
  return normalizeItemList(res)
}

export async function listTraceLinks(
  projectId: string
): Promise<{ items: TraceLink[] }> {
  const res = await apiClient.get<ListPayload<TraceLink>>(TRACEABILITY_ENDPOINTS.traceLinks(projectId))
  return normalizeItemList(res)
}

export async function createTraceLink(
  projectId: string,
  body: {
    sourceType: string
    sourceId: string
    targetType: string
    targetId: string
    linkType: string
  }
): Promise<TraceLink> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.traceLinks(projectId), body)
}

export async function listApplications(
  workspaceId: string
): Promise<{ items: ApplicationItem[] }> {
  const res = await apiClient.get<ListPayload<ApplicationItem>>(TRACEABILITY_ENDPOINTS.applications(workspaceId))
  return normalizeItemList(res)
}

export async function createApplication(
  workspaceId: string,
  body: { code: string; name: string; description?: string | null }
): Promise<ApplicationItem> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.createApplication(workspaceId), body)
}
