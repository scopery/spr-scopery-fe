import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  AIAgentAdminSummary,
  AIAgentDetail,
  AIAgentListItem,
  AIAgentVersionDetail,
  AIModelSelectItem,
  AIRunLogListResult,
  AIUsageSummary,
  UpdateAIAgentPayload,
  UpdateAIAgentVersionPayload,
} from '../model/ai-agent-control'

function assertEnabled(): void {
  if (!FEATURES.aiAdminAgents) {
    throw new Error('AI Agent Control is currently disabled.')
  }
}

function orgQuery(orgId?: string): string {
  return orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
}

export async function getAgentsSummary(orgId?: string): Promise<AIAgentAdminSummary> {
  assertEnabled()
  return apiClient.get<AIAgentAdminSummary>(`/api/v2/admin/ai-agents/summary${orgQuery(orgId)}`)
}

export async function listAgents(orgId?: string): Promise<{ items: AIAgentListItem[] }> {
  assertEnabled()
  return apiClient.get<{ items: AIAgentListItem[] }>(`/api/v2/admin/ai-agents${orgQuery(orgId)}`)
}

export async function getAgent(agentId: string, orgId?: string): Promise<AIAgentDetail> {
  assertEnabled()
  return apiClient.get<AIAgentDetail>(`/api/v2/admin/ai-agents/${agentId}${orgQuery(orgId)}`)
}

export async function updateAgent(
  agentId: string,
  payload: UpdateAIAgentPayload
): Promise<AIAgentDetail> {
  assertEnabled()
  await apiClient.patch(`/api/v2/admin/ai-agents/${agentId}`, payload)
  return getAgent(agentId)
}

export async function createDraftFromPublished(agentId: string): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.post<AIAgentVersionDetail>(
    `/api/v2/admin/ai-agents/${agentId}/versions/draft-from-published`,
    {}
  )
}

export async function getAgentVersion(
  agentId: string,
  versionId: string
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.get<AIAgentVersionDetail>(
    `/api/v2/admin/ai-agents/${agentId}/versions/${versionId}`
  )
}

export async function updateAgentVersion(
  agentId: string,
  versionId: string,
  payload: UpdateAIAgentVersionPayload
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  await apiClient.patch(`/api/v2/admin/ai-agents/${agentId}/versions/${versionId}`, payload)
  return getAgentVersion(agentId, versionId)
}

export async function publishAgentVersion(
  agentId: string,
  versionId: string
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.post<AIAgentVersionDetail>(
    `/api/v2/admin/ai-agents/${agentId}/versions/${versionId}/publish`,
    {}
  )
}

export async function archiveAgentVersion(
  agentId: string,
  versionId: string
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.post<AIAgentVersionDetail>(
    `/api/v2/admin/ai-agents/${agentId}/versions/${versionId}/archive`,
    {}
  )
}

export async function listModels(): Promise<{ items: AIModelSelectItem[] }> {
  assertEnabled()
  return apiClient.get<{ items: AIModelSelectItem[] }>('/api/v2/admin/ai-models')
}

export async function getAgentUsageSummary(
  agentId: string,
  params: {
    org_id: string
    date_from?: string
    date_to?: string
    status?: string
    mode?: string
    model_id?: string
  }
): Promise<AIUsageSummary> {
  assertEnabled()
  const search = new URLSearchParams()
  search.set('org_id', params.org_id)
  if (params.date_from) search.set('date_from', params.date_from)
  if (params.date_to) search.set('date_to', params.date_to)
  if (params.status) search.set('status', params.status)
  if (params.mode) search.set('mode', params.mode)
  if (params.model_id) search.set('model_id', params.model_id)
  return apiClient.get<AIUsageSummary>(
    `/api/v2/admin/ai-agents/${agentId}/usage-summary?${search.toString()}`
  )
}

export async function listAgentRunLogs(
  agentId: string,
  params: {
    org_id: string
    date_from?: string
    date_to?: string
    status?: string
    mode?: string
    model_id?: string
    user_id?: string
    limit?: number
    offset?: number
  }
): Promise<AIRunLogListResult> {
  assertEnabled()
  const search = new URLSearchParams()
  search.set('org_id', params.org_id)
  if (params.date_from) search.set('date_from', params.date_from)
  if (params.date_to) search.set('date_to', params.date_to)
  if (params.status) search.set('status', params.status)
  if (params.mode) search.set('mode', params.mode)
  if (params.model_id) search.set('model_id', params.model_id)
  if (params.user_id) search.set('user_id', params.user_id)
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.offset != null) search.set('offset', String(params.offset))
  return apiClient.get<AIRunLogListResult>(
    `/api/v2/admin/ai-agents/${agentId}/run-logs?${search.toString()}`
  )
}

export type {
  AIAgentAdminSummary,
  AIAgentListItem,
  AIAgentDetail,
  AIAgentVersionDetail,
  AIModelSelectItem,
  UpdateAIAgentPayload,
} from '../model/ai-agent-control'
