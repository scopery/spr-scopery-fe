import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import type {
  AiGuideDefinition,
  CreateAiGuideDefinitionPayload,
  UpdateAiGuideDefinitionPayload,
} from '../../domain/model/guide-definition'

export async function listGuideDefinitions(): Promise<AiGuideDefinition[]> {
  return apiClient.get<AiGuideDefinition[]>(AI_AGENT_ADMIN_ENDPOINTS.aiAssistantGuides())
}

export async function getGuideDefinition(id: string): Promise<AiGuideDefinition> {
  return apiClient.get<AiGuideDefinition>(AI_AGENT_ADMIN_ENDPOINTS.aiAssistantGuide(id))
}

export async function createGuideDefinition(
  body: CreateAiGuideDefinitionPayload
): Promise<AiGuideDefinition> {
  return apiClient.post<AiGuideDefinition>(AI_AGENT_ADMIN_ENDPOINTS.aiAssistantGuides(), body)
}

export async function updateGuideDefinition(
  id: string,
  body: UpdateAiGuideDefinitionPayload
): Promise<AiGuideDefinition> {
  return apiClient.patch<AiGuideDefinition>(AI_AGENT_ADMIN_ENDPOINTS.aiAssistantGuide(id), body)
}

export async function retireGuideDefinition(id: string): Promise<void> {
  return apiClient.delete<void>(AI_AGENT_ADMIN_ENDPOINTS.aiAssistantGuide(id))
}
