import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiEventConfig,
  AiEventConfigPage,
  CreateAiEventConfigPayload,
  ResolveEventConfigParams,
  SearchAiEventConfigsParams,
  UpdateAiEventConfigPayload,
} from '../../domain/model/event-config'

export async function listEventConfigs(
  params?: SearchAiEventConfigsParams
): Promise<AiEventConfigPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.eventConfigs(params))
  return normalizeAiAdminPage<AiEventConfig>(res)
}

export async function getEventConfig(id: string): Promise<AiEventConfig> {
  return apiClient.get<AiEventConfig>(AI_AGENT_ADMIN_ENDPOINTS.eventConfig(id))
}

export async function resolveEventConfig(
  params: ResolveEventConfigParams
): Promise<AiEventConfig> {
  return apiClient.get<AiEventConfig>(AI_AGENT_ADMIN_ENDPOINTS.resolveEventConfig(params))
}

export async function createEventConfig(
  body: CreateAiEventConfigPayload
): Promise<AiEventConfig> {
  return apiClient.post<AiEventConfig>(AI_AGENT_ADMIN_ENDPOINTS.eventConfigs(), body)
}

export async function updateEventConfig(
  id: string,
  body: UpdateAiEventConfigPayload
): Promise<AiEventConfig> {
  return apiClient.put<AiEventConfig>(AI_AGENT_ADMIN_ENDPOINTS.eventConfig(id), body)
}

export async function activateEventConfig(id: string): Promise<AiEventConfig> {
  return apiClient.patch<AiEventConfig>(AI_AGENT_ADMIN_ENDPOINTS.activateEventConfig(id))
}

export async function deactivateEventConfig(id: string): Promise<AiEventConfig> {
  return apiClient.patch<AiEventConfig>(
    AI_AGENT_ADMIN_ENDPOINTS.deactivateEventConfig(id)
  )
}
