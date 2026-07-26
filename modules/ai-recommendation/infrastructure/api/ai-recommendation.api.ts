import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { AI_RECOMMENDATION_ENDPOINTS } from './endpoints'
import type { AiRecommendation } from '../../domain/model/recommendation'

export async function listRecommendations(
  params?: {
    projectId?: string
    workspaceId?: string
  },
  options?: { skipErrorToast?: boolean }
): Promise<{ items: AiRecommendation[] }> {
  const res = await apiClient.get<ListPayload<AiRecommendation>>(
    AI_RECOMMENDATION_ENDPOINTS.list(params),
    options
  )
  return normalizeItemList(res)
}

export async function markRecommendationViewed(
  suggestionRef: string,
  options?: { skipErrorToast?: boolean }
): Promise<void> {
  await apiClient.post(
    AI_RECOMMENDATION_ENDPOINTS.view(suggestionRef),
    {},
    { parseJson: false, ...options }
  )
}

export async function acceptRecommendation(
  suggestionRef: string
): Promise<AiRecommendation> {
  return apiClient.post(AI_RECOMMENDATION_ENDPOINTS.accept(suggestionRef), {})
}

export async function rejectRecommendation(
  suggestionRef: string,
  body?: { reasonCode?: string; comment?: string }
): Promise<AiRecommendation> {
  return apiClient.post(AI_RECOMMENDATION_ENDPOINTS.reject(suggestionRef), {
    reasonCode: body?.reasonCode ?? 'USER_REJECTED',
    comment: body?.comment ?? null,
  })
}

export async function prepareApplyRecommendation(
  suggestionRef: string
): Promise<{ suggestionRef: string; ready: boolean; warnings?: string[] }> {
  return apiClient.post(AI_RECOMMENDATION_ENDPOINTS.prepareApply(suggestionRef), {})
}
