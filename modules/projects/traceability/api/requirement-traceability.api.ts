import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  CoverageSummaryResponse,
  GapsQuery,
  GapsResponse,
  LinkableFunction,
  LinkableUseCase,
  RequirementTraceDetailResponse,
  RequirementTraceHistoryResponse,
  TraceabilityMatrixQuery,
  TraceabilityMatrixResponse,
} from '../model/requirement-traceability'

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const REQUIREMENT_TRACEABILITY_ENDPOINTS = {
  coverageSummary: (projectId: string) =>
    apiPath(`/projects/${projectId}/traceability/coverage-summary`),
  matrix: (projectId: string, params?: TraceabilityMatrixQuery) =>
    apiPath(`/projects/${projectId}/traceability/matrix`) +
    qs({
      q: params?.q,
      coverageStatus: params?.coverageStatus,
      gapCode: params?.gapCode,
      requirementType: params?.requirementType,
      showGapsOnly: params?.showGapsOnly,
      limit: params?.limit,
      offset: params?.offset,
    }),
  requirementDetail: (projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/traceability/requirements/${requirementId}`),
  gaps: (projectId: string, params?: GapsQuery) =>
    apiPath(`/projects/${projectId}/traceability/gaps`) +
    qs({
      gapCode: params?.gapCode,
      priority: params?.priority,
      requirementId: params?.requirementId,
      q: params?.q,
      limit: params?.limit,
      offset: params?.offset,
    }),
  history: (projectId: string, requirementId: string, params?: { limit?: number; offset?: number }) =>
    apiPath(`/projects/${projectId}/traceability/requirements/${requirementId}/history`) +
    qs({ limit: params?.limit, offset: params?.offset }),
  linkableFunctions: (
    projectId: string,
    requirementId: string,
    params?: { q?: string; limit?: number }
  ) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/linkable-functions`) +
    qs({ q: params?.q, limit: params?.limit }),
  linkableUseCases: (
    projectId: string,
    requirementId: string,
    params?: { q?: string; limit?: number }
  ) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/linkable-use-cases`) +
    qs({ q: params?.q, limit: params?.limit }),
  setRequiresUseCase: (projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/requires-use-case`),
} as const

export async function getCoverageSummary(
  projectId: string
): Promise<CoverageSummaryResponse> {
  return apiClient.get<CoverageSummaryResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.coverageSummary(projectId)
  )
}

export async function getTraceabilityMatrix(
  projectId: string,
  params?: TraceabilityMatrixQuery
): Promise<TraceabilityMatrixResponse> {
  return apiClient.get<TraceabilityMatrixResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.matrix(projectId, params)
  )
}

export async function getRequirementTraceDetail(
  projectId: string,
  requirementId: string
): Promise<RequirementTraceDetailResponse> {
  return apiClient.get<RequirementTraceDetailResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.requirementDetail(projectId, requirementId)
  )
}

export async function getTraceabilityGaps(
  projectId: string,
  params?: GapsQuery
): Promise<GapsResponse> {
  return apiClient.get<GapsResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.gaps(projectId, params)
  )
}

export async function getRequirementTraceHistory(
  projectId: string,
  requirementId: string,
  params?: { limit?: number; offset?: number }
): Promise<RequirementTraceHistoryResponse> {
  return apiClient.get<RequirementTraceHistoryResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.history(projectId, requirementId, params)
  )
}

export async function listLinkableFunctions(
  projectId: string,
  requirementId: string,
  params?: { q?: string; limit?: number }
): Promise<LinkableFunction[]> {
  const res = await apiClient.get<LinkableFunction[] | { items: LinkableFunction[] }>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.linkableFunctions(projectId, requirementId, params)
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function listLinkableUseCases(
  projectId: string,
  requirementId: string,
  params?: { q?: string; limit?: number }
): Promise<LinkableUseCase[]> {
  const res = await apiClient.get<LinkableUseCase[] | { items: LinkableUseCase[] }>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.linkableUseCases(projectId, requirementId, params)
  )
  return Array.isArray(res) ? res : (res.items ?? [])
}

export async function setRequiresUseCase(
  projectId: string,
  requirementId: string,
  value: 'YES' | 'NO' | 'AUTO'
): Promise<{ requiresUseCase: string; requiresUseCaseResolved: boolean }> {
  return apiClient.patch(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.setRequiresUseCase(projectId, requirementId),
    { value }
  )
}
