import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiParameterCapability,
  AiParameterCapabilityPage,
  CreateAiParameterCapabilityPayload,
  SearchAiParameterCapabilitiesParams,
  UpdateAiParameterCapabilityPayload,
} from '../../domain/model/capability'

export async function listCapabilities(
  params?: SearchAiParameterCapabilitiesParams
): Promise<AiParameterCapabilityPage> {
  const res = await apiClient.get<unknown>(
    AI_AGENT_ADMIN_ENDPOINTS.parameterCapabilities(params)
  )
  return normalizeAiAdminPage<AiParameterCapability>(res)
}

export async function getCapability(id: string): Promise<AiParameterCapability> {
  return apiClient.get<AiParameterCapability>(
    AI_AGENT_ADMIN_ENDPOINTS.parameterCapability(id)
  )
}

export async function createCapability(
  body: CreateAiParameterCapabilityPayload
): Promise<AiParameterCapability> {
  return apiClient.post<AiParameterCapability>(
    AI_AGENT_ADMIN_ENDPOINTS.parameterCapabilities(),
    body
  )
}

export async function updateCapability(
  id: string,
  body: UpdateAiParameterCapabilityPayload
): Promise<AiParameterCapability> {
  return apiClient.put<AiParameterCapability>(
    AI_AGENT_ADMIN_ENDPOINTS.parameterCapability(id),
    body
  )
}

export async function activateCapability(id: string): Promise<AiParameterCapability> {
  return apiClient.patch<AiParameterCapability>(
    AI_AGENT_ADMIN_ENDPOINTS.activateParameterCapability(id)
  )
}

export async function deactivateCapability(id: string): Promise<AiParameterCapability> {
  return apiClient.patch<AiParameterCapability>(
    AI_AGENT_ADMIN_ENDPOINTS.deactivateParameterCapability(id)
  )
}
