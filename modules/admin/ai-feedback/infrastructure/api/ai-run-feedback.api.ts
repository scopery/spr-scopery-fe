import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList } from '@/shared/lib/normalizeListResponse'
import { AI_FEEDBACK_ENDPOINTS } from './endpoints'
import type {
  AIQualitySummary,
  AIRunFeedbackListItem,
  AIFeedbackStatus,
  AIPromptVersionQualityItem,
  SubmitAIRunFeedbackPayload,
} from '../../domain/model/ai-run-feedback'

export async function submitRunFeedback(
  orgId: string,
  runId: string,
  payload: SubmitAIRunFeedbackPayload
): Promise<{ feedbackId: string; updated: boolean }> {
  return apiClient.post<{ feedbackId: string; updated: boolean }>(
    AI_FEEDBACK_ENDPOINTS.submitFeedback(orgId, runId),
    payload
  )
}

export async function getAgentQualitySummary(
  agentId: string,
  params?: { org_id?: string }
): Promise<AIQualitySummary> {
  return apiClient.get<AIQualitySummary>(AI_FEEDBACK_ENDPOINTS.quality.summary(agentId, params?.org_id))
}

export async function listAgentFeedback(
  agentId: string,
  params?: {
    org_id?: string
    rating?: string
    status?: string
    limit?: number
    offset?: number
  }
): Promise<{
  items: AIRunFeedbackListItem[]
  page: { limit: number; offset: number; total: number }
}> {
  const res = await apiClient.get<
    AIRunFeedbackListItem[] | { items?: AIRunFeedbackListItem[]; page?: { limit: number; offset: number; total: number } }
  >(AI_FEEDBACK_ENDPOINTS.quality.feedback(agentId, params))
  const { items } = normalizeItemList(res)
  const page =
    !Array.isArray(res) && res?.page
      ? res.page
      : {
          limit: params?.limit ?? items.length,
          offset: params?.offset ?? 0,
          total: items.length,
        }
  return { items, page }
}

export async function getAgentVersionQuality(
  agentId: string,
  orgId?: string
): Promise<{ items: AIPromptVersionQualityItem[] }> {
  const res = await apiClient.get<AIPromptVersionQualityItem[]>(
    AI_FEEDBACK_ENDPOINTS.quality.versions(agentId, orgId)
  )
  return normalizeItemList(res)
}

export async function updateFeedbackStatus(
  feedbackId: string,
  payload: { status: AIFeedbackStatus; resolution_note?: string | null }
): Promise<{ feedbackId: string; status: AIFeedbackStatus }> {
  return apiClient.patch(AI_FEEDBACK_ENDPOINTS.updateStatus(feedbackId), payload)
}
