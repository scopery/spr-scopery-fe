import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import type {
  AiAssistantWorkspaceConfig,
  UpsertAiAssistantWorkspaceConfigPayload,
} from '../../domain/model/ai-assistant-settings'

export async function getAiAssistantWorkspaceConfig(
  workspaceId: string
): Promise<AiAssistantWorkspaceConfig | null> {
  try {
    return await apiClient.get<AiAssistantWorkspaceConfig>(
      AI_AGENT_ADMIN_ENDPOINTS.aiAssistantWorkspaceConfig(workspaceId)
    )
  } catch {
    return null
  }
}

export async function upsertAiAssistantWorkspaceConfig(
  workspaceId: string,
  payload: UpsertAiAssistantWorkspaceConfigPayload
): Promise<AiAssistantWorkspaceConfig> {
  return apiClient.put<AiAssistantWorkspaceConfig>(
    AI_AGENT_ADMIN_ENDPOINTS.aiAssistantWorkspaceConfig(workspaceId),
    payload
  )
}
