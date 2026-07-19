import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { AI_PLANNING_ENDPOINTS } from './endpoints'
import type { AiPlanningRun, AiPlanningSuggestion } from '../../domain/model/planning'

export async function listPlanningRuns(
  projectId: string
): Promise<{ items: AiPlanningRun[] }> {
  const res = await apiClient.get<ListPayload<AiPlanningRun>>(AI_PLANNING_ENDPOINTS.runs(projectId))
  return normalizeItemList(res)
}

export async function listSuggestions(
  projectId: string,
  runId: string
): Promise<{ items: AiPlanningSuggestion[] }> {
  const res = await apiClient.get<ListPayload<AiPlanningSuggestion>>(AI_PLANNING_ENDPOINTS.suggestions(projectId, runId))
  return normalizeItemList(res)
}

export async function previewApplySuggestion(
  projectId: string,
  suggestionId: string
): Promise<{
  fields: Array<{ path: string; label: string; before: string | null; after: string | null }>
  requiresChangeRequest?: boolean
}> {
  return apiClient.get(AI_PLANNING_ENDPOINTS.applyPreview(projectId, suggestionId))
}

export async function acceptSuggestion(
  projectId: string,
  suggestionId: string
): Promise<AiPlanningSuggestion> {
  return apiClient.post(AI_PLANNING_ENDPOINTS.accept(projectId, suggestionId), {})
}

export async function rejectSuggestion(
  projectId: string,
  suggestionId: string,
  reason?: string
): Promise<AiPlanningSuggestion> {
  return apiClient.post(AI_PLANNING_ENDPOINTS.reject(projectId, suggestionId), {
    reason: reason ?? null,
  })
}

export async function applySuggestion(
  projectId: string,
  suggestionId: string,
  body?: {
    applyMode?: string
    requireChangeRequestIfBaselined?: boolean
    idempotencyKey?: string
  }
): Promise<AiPlanningSuggestion> {
  return apiClient.post(AI_PLANNING_ENDPOINTS.apply(projectId, suggestionId), {
    applyMode: body?.applyMode ?? 'DIRECT',
    requireChangeRequestIfBaselined: body?.requireChangeRequestIfBaselined ?? true,
    idempotencyKey: body?.idempotencyKey ?? `apply-${suggestionId}-${Date.now()}`,
  })
}
