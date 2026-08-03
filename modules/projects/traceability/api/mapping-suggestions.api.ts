import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import {
  mapMappingSuggestionRaw,
  type ApplyMappingDraftResult,
  type GenerateMappingBody,
  type MappingRun,
  type MappingSuggestionPage,
  type MappingSuggestionRaw,
  type ReviewMappingBody,
} from '../model/mapping-suggestions'

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const MAPPING_SUGGESTIONS_ENDPOINTS = {
  base: (projectId: string) => apiPath(`/projects/${projectId}/mapping-suggestions`),
  generate: (projectId: string) =>
    apiPath(`/projects/${projectId}/mapping-suggestions/generate`),
  review: (projectId: string) =>
    apiPath(`/projects/${projectId}/mapping-suggestions/review`),
  apply: (projectId: string, runId: string) =>
    apiPath(`/projects/${projectId}/mapping-suggestions/${runId}/apply`),
  run: (projectId: string, runId: string) =>
    apiPath(`/projects/${projectId}/mapping-suggestions/runs/${runId}`),
  list: (
    projectId: string,
    params: {
      runId: string
      relationType?: string
      reviewStatus?: string
      confidenceBand?: string
      decision?: string
      hasWarning?: boolean
      sourceId?: string
      targetId?: string
      page?: number
      size?: number
    }
  ) =>
    apiPath(`/projects/${projectId}/mapping-suggestions`) +
    qs({
      runId: params.runId,
      relationType: params.relationType,
      reviewStatus: params.reviewStatus,
      confidenceBand: params.confidenceBand,
      decision: params.decision,
      hasWarning: params.hasWarning,
      sourceId: params.sourceId,
      targetId: params.targetId,
      page: params.page,
      size: params.size,
    }),
} as const

export async function generateMappingSuggestions(
  projectId: string,
  body: GenerateMappingBody
): Promise<MappingRun> {
  return apiClient.post<MappingRun>(MAPPING_SUGGESTIONS_ENDPOINTS.generate(projectId), body)
}

export async function listMappingSuggestions(
  projectId: string,
  params: {
    runId: string
    relationType?: string
    reviewStatus?: string
    confidenceBand?: string
    decision?: string
    hasWarning?: boolean
    sourceId?: string
    targetId?: string
    page?: number
    size?: number
  }
): Promise<MappingSuggestionPage> {
  const res = await apiClient.get<{
    items: MappingSuggestionRaw[]
    page: number
    size: number
    totalElements: number
    totalPages: number
    first: boolean
    last: boolean
  }>(MAPPING_SUGGESTIONS_ENDPOINTS.list(projectId, params))

  return {
    ...res,
    items: (res.items ?? []).map(mapMappingSuggestionRaw),
  }
}

export async function getMappingRun(
  projectId: string,
  runId: string
): Promise<MappingRun> {
  return apiClient.get<MappingRun>(MAPPING_SUGGESTIONS_ENDPOINTS.run(projectId, runId))
}

export async function reviewMappingSuggestions(
  projectId: string,
  body: ReviewMappingBody
): Promise<void> {
  await apiClient.post<null>(MAPPING_SUGGESTIONS_ENDPOINTS.review(projectId), body)
}

export async function applyMappingDraft(
  projectId: string,
  runId: string
): Promise<ApplyMappingDraftResult> {
  return apiClient.post<ApplyMappingDraftResult>(
    MAPPING_SUGGESTIONS_ENDPOINTS.apply(projectId, runId),
    {}
  )
}
