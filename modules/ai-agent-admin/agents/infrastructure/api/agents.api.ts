import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiAgent,
  AiAgentPage,
  CreateAiAgentPayload,
  SearchAiAgentsParams,
  UpdateAiAgentPayload,
} from '../../domain/model/agent'

export async function listAgents(params?: SearchAiAgentsParams): Promise<AiAgentPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.agents(params))
  return normalizeAiAdminPage<AiAgent>(res)
}

export async function getAgent(id: string): Promise<AiAgent> {
  return apiClient.get<AiAgent>(AI_AGENT_ADMIN_ENDPOINTS.agent(id))
}

export async function createAgent(body: CreateAiAgentPayload): Promise<AiAgent> {
  return apiClient.post<AiAgent>(AI_AGENT_ADMIN_ENDPOINTS.agents(), body)
}

export async function updateAgent(
  id: string,
  body: UpdateAiAgentPayload
): Promise<AiAgent> {
  return apiClient.put<AiAgent>(AI_AGENT_ADMIN_ENDPOINTS.agent(id), body)
}

export async function activateAgent(id: string): Promise<AiAgent> {
  return apiClient.patch<AiAgent>(AI_AGENT_ADMIN_ENDPOINTS.activateAgent(id))
}

export async function deactivateAgent(id: string): Promise<AiAgent> {
  return apiClient.patch<AiAgent>(AI_AGENT_ADMIN_ENDPOINTS.deactivateAgent(id))
}
