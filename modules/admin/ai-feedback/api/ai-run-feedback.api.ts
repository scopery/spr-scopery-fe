import { apiClient } from '@/shared/lib/apiClient'
import type {
  AIQualitySummary,
  AIRunFeedbackListItem,
  AIFeedbackStatus,
  AIPromptVersionQualityItem,
  SubmitAIRunFeedbackPayload,
} from '../model/ai-run-feedback'

export async function submitRunFeedback(
  orgId: string,
  runId: string,
  payload: SubmitAIRunFeedbackPayload
): Promise<{ feedbackId: string; updated: boolean }> {
  return apiClient.post<{ feedbackId: string; updated: boolean }>(
    `/api/v2/orgs/${orgId}/ai-runs/${runId}/feedback`,
    payload
  )
}

export async function getAgentQualitySummary(
  agentId: string,
  params?: { org_id?: string }
): Promise<AIQualitySummary> {
  const qs = params?.org_id ? `?org_id=${encodeURIComponent(params.org_id)}` : ''
  return apiClient.get<AIQualitySummary>(`/api/v2/admin/ai-agents/${agentId}/quality/summary${qs}`)
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
  const search = new URLSearchParams()
  if (params?.org_id) search.set('org_id', params.org_id)
  if (params?.rating) search.set('rating', params.rating)
  if (params?.status) search.set('status', params.status)
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.offset != null) search.set('offset', String(params.offset))
  const qs = search.toString()
  return apiClient.get(`/api/v2/admin/ai-agents/${agentId}/quality/feedback${qs ? `?${qs}` : ''}`)
}

export async function getAgentVersionQuality(
  agentId: string,
  orgId?: string
): Promise<{ items: AIPromptVersionQualityItem[] }> {
  const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  return apiClient.get(`/api/v2/admin/ai-agents/${agentId}/quality/versions${qs}`)
}

export async function updateFeedbackStatus(
  feedbackId: string,
  payload: { status: AIFeedbackStatus; resolution_note?: string | null }
): Promise<{ feedbackId: string; status: AIFeedbackStatus }> {
  return apiClient.patch(`/api/v2/admin/ai-feedback/${feedbackId}/status`, payload)
}

export type {
  AIQualitySummary,
  AIRunFeedbackListItem,
  AIFeedbackStatus,
  AIPromptVersionQualityItem,
  SubmitAIRunFeedbackPayload,
} from '../model/ai-run-feedback'
