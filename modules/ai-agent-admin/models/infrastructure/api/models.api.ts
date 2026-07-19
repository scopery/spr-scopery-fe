import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiModel,
  AiModelPage,
  CreateAiModelPayload,
  SearchAiModelsParams,
  UpdateAiModelPayload,
} from '../../domain/model/ai-model'

export async function listModels(params?: SearchAiModelsParams): Promise<AiModelPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.models(params))
  return normalizeAiAdminPage<AiModel>(res)
}

export async function getModel(id: string): Promise<AiModel> {
  return apiClient.get<AiModel>(AI_AGENT_ADMIN_ENDPOINTS.model(id))
}

export async function createModel(body: CreateAiModelPayload): Promise<AiModel> {
  return apiClient.post<AiModel>(AI_AGENT_ADMIN_ENDPOINTS.models(), body)
}

export async function updateModel(id: string, body: UpdateAiModelPayload): Promise<AiModel> {
  return apiClient.put<AiModel>(AI_AGENT_ADMIN_ENDPOINTS.model(id), body)
}

export async function activateModel(id: string): Promise<AiModel> {
  return apiClient.patch<AiModel>(AI_AGENT_ADMIN_ENDPOINTS.activateModel(id))
}

export async function deactivateModel(id: string): Promise<AiModel> {
  return apiClient.patch<AiModel>(AI_AGENT_ADMIN_ENDPOINTS.deactivateModel(id))
}
