import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  CoverageListQuery,
  CoverageSummaryResponse,
  FunctionCoverageListResponse,
  GapsQuery,
  GapsResponse,
  ImplementationCoverageListResponse,
  LinkableFunction,
  LinkableUseCase,
  NfrVerificationListResponse,
  RequirementTraceDetailResponse,
  RequirementTraceHistoryResponse,
  TraceabilityMatrixQuery,
  TraceabilityMatrixResponse,
  TraceabilityOverviewResponse,
  TraceExplorerResponse,
  UseCaseCoverageListResponse,
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
  overview: (projectId: string) => apiPath(`/projects/${projectId}/traceability/overview`),
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
  functions: (projectId: string, params?: CoverageListQuery) =>
    apiPath(`/projects/${projectId}/traceability/functions`) +
    qs({
      q: params?.q,
      coverageStatus: params?.coverageStatus,
      limit: params?.limit,
      offset: params?.offset,
    }),
  useCases: (projectId: string, params?: CoverageListQuery) =>
    apiPath(`/projects/${projectId}/traceability/use-cases`) +
    qs({
      q: params?.q,
      coverageStatus: params?.coverageStatus,
      limit: params?.limit,
      offset: params?.offset,
    }),
  implementation: (projectId: string, params?: CoverageListQuery) =>
    apiPath(`/projects/${projectId}/traceability/implementation`) +
    qs({
      q: params?.q,
      coverageStatus: params?.coverageStatus,
      limit: params?.limit,
      offset: params?.offset,
    }),
  nfrVerification: (projectId: string, params?: CoverageListQuery) =>
    apiPath(`/projects/${projectId}/traceability/nfr-verification`) +
    qs({
      q: params?.q,
      coverageStatus: params?.coverageStatus,
      limit: params?.limit,
      offset: params?.offset,
    }),
  explorer: (projectId: string, params: { rootType: string; rootId: string }) =>
    apiPath(`/projects/${projectId}/traceability/explorer`) +
    qs({ rootType: params.rootType, rootId: params.rootId }),
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

export async function getTraceabilityOverview(
  projectId: string
): Promise<TraceabilityOverviewResponse> {
  return apiClient.get<TraceabilityOverviewResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.overview(projectId)
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

export async function listFunctionCoverage(
  projectId: string,
  params?: CoverageListQuery
): Promise<FunctionCoverageListResponse> {
  return apiClient.get<FunctionCoverageListResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.functions(projectId, params)
  )
}

export async function listUseCaseCoverage(
  projectId: string,
  params?: CoverageListQuery
): Promise<UseCaseCoverageListResponse> {
  return apiClient.get<UseCaseCoverageListResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.useCases(projectId, params)
  )
}

export async function listImplementationCoverage(
  projectId: string,
  params?: CoverageListQuery
): Promise<ImplementationCoverageListResponse> {
  return apiClient.get<ImplementationCoverageListResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.implementation(projectId, params)
  )
}

export async function listNfrVerification(
  projectId: string,
  params?: CoverageListQuery
): Promise<NfrVerificationListResponse> {
  return apiClient.get<NfrVerificationListResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.nfrVerification(projectId, params)
  )
}

export async function getTraceExplorer(
  projectId: string,
  params: { rootType: string; rootId: string }
): Promise<TraceExplorerResponse> {
  return apiClient.get<TraceExplorerResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.explorer(projectId, params)
  )
}

function normalizeTraceDetailRequirement(
  requirement: RequirementTraceDetailResponse['requirement'] & Record<string, unknown>
): RequirementTraceDetailResponse['requirement'] {
  const description =
    (typeof requirement.description === 'string' ? requirement.description : null) ??
    (typeof requirement.Description === 'string' ? requirement.Description : null) ??
    null
  const priority =
    (typeof requirement.priority === 'string' ? requirement.priority : null) ??
    (typeof requirement.Priority === 'string' ? requirement.Priority : null) ??
    null
  return {
    ...requirement,
    description: description ?? requirement.description ?? null,
    priority: priority ?? requirement.priority ?? null,
  }
}

export async function getRequirementTraceDetail(
  projectId: string,
  requirementId: string
): Promise<RequirementTraceDetailResponse> {
  const res = await apiClient.get<RequirementTraceDetailResponse>(
    REQUIREMENT_TRACEABILITY_ENDPOINTS.requirementDetail(projectId, requirementId)
  )
  return {
    ...res,
    requirement: normalizeTraceDetailRequirement(
      res.requirement as RequirementTraceDetailResponse['requirement'] & Record<string, unknown>
    ),
  }
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
