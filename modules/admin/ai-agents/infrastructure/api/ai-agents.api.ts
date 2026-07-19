import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
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
} from '../../domain/model/ai-agent-control'
import { AI_AGENTS_ENDPOINTS } from './endpoints'

function assertEnabled(): void {
  if (!FEATURES.aiAdminAgents) {
    throw new Error('AI Agent Control is currently disabled.')
  }
}

export async function getAgentsSummary(orgId?: string): Promise<AIAgentAdminSummary> {
  assertEnabled()
  return apiClient.get<AIAgentAdminSummary>(AI_AGENTS_ENDPOINTS.summary({ orgId }))
}

export async function listAgents(orgId?: string): Promise<{ items: AIAgentListItem[] }> {
  assertEnabled()
  const res = await apiClient.get<ListPayload<AIAgentListItem>>(AI_AGENTS_ENDPOINTS.list({ orgId }))
  return normalizeItemList(res)
}

export async function getAgent(agentId: string, orgId?: string): Promise<AIAgentDetail> {
  assertEnabled()
  return apiClient.get<AIAgentDetail>(AI_AGENTS_ENDPOINTS.detail(agentId, { orgId }))
}

export async function updateAgent(
  agentId: string,
  payload: UpdateAIAgentPayload
): Promise<AIAgentDetail> {
  assertEnabled()
  await apiClient.patch(AI_AGENTS_ENDPOINTS.detail(agentId), payload)
  return getAgent(agentId)
}

export async function createDraftFromPublished(agentId: string): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.post<AIAgentVersionDetail>(
    AI_AGENTS_ENDPOINTS.versions.draftFromPublished(agentId),
    {}
  )
}

export async function getAgentVersion(
  agentId: string,
  versionId: string
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.get<AIAgentVersionDetail>(AI_AGENTS_ENDPOINTS.versions.detail(agentId, versionId))
}

export async function updateAgentVersion(
  agentId: string,
  versionId: string,
  payload: UpdateAIAgentVersionPayload
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  await apiClient.patch(AI_AGENTS_ENDPOINTS.versions.detail(agentId, versionId), payload)
  return getAgentVersion(agentId, versionId)
}

export async function publishAgentVersion(
  agentId: string,
  versionId: string
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.post<AIAgentVersionDetail>(
    AI_AGENTS_ENDPOINTS.versions.publish(agentId, versionId),
    {}
  )
}

export async function archiveAgentVersion(
  agentId: string,
  versionId: string
): Promise<AIAgentVersionDetail> {
  assertEnabled()
  return apiClient.post<AIAgentVersionDetail>(
    AI_AGENTS_ENDPOINTS.versions.archive(agentId, versionId),
    {}
  )
}

export async function listModels(): Promise<{ items: AIModelSelectItem[] }> {
  assertEnabled()
  const res = await apiClient.get<ListPayload<AIModelSelectItem>>(AI_AGENTS_ENDPOINTS.models())
  return normalizeItemList(res)
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
  return apiClient.get<AIUsageSummary>(AI_AGENTS_ENDPOINTS.usageSummary(agentId, params))
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
  return apiClient.get<AIRunLogListResult>(AI_AGENTS_ENDPOINTS.runLogs(agentId, params))
}
