import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiPromptTemplate,
  AiPromptTemplatePage,
  CreateAiPromptTemplatePayload,
  SearchAiPromptTemplatesParams,
  UpdateAiPromptTemplatePayload,
} from '../../domain/model/prompt-template'
import type {
  AiPromptVersion,
  AiPromptVersionPage,
  CreateAiPromptVersionPayload,
  SearchAiPromptVersionsParams,
  UpdateAiPromptVersionPayload,
} from '../../domain/model/prompt-version'

export async function listPromptTemplates(
  params?: SearchAiPromptTemplatesParams
): Promise<AiPromptTemplatePage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.promptTemplates(params))
  return normalizeAiAdminPage<AiPromptTemplate>(res)
}

export async function getPromptTemplate(id: string): Promise<AiPromptTemplate> {
  return apiClient.get<AiPromptTemplate>(AI_AGENT_ADMIN_ENDPOINTS.promptTemplate(id))
}

export async function createPromptTemplate(
  body: CreateAiPromptTemplatePayload
): Promise<AiPromptTemplate> {
  return apiClient.post<AiPromptTemplate>(AI_AGENT_ADMIN_ENDPOINTS.promptTemplates(), body)
}

export async function updatePromptTemplate(
  id: string,
  body: UpdateAiPromptTemplatePayload
): Promise<AiPromptTemplate> {
  return apiClient.put<AiPromptTemplate>(AI_AGENT_ADMIN_ENDPOINTS.promptTemplate(id), body)
}

export async function activatePromptTemplate(id: string): Promise<AiPromptTemplate> {
  return apiClient.patch<AiPromptTemplate>(
    AI_AGENT_ADMIN_ENDPOINTS.activatePromptTemplate(id)
  )
}

export async function deactivatePromptTemplate(id: string): Promise<AiPromptTemplate> {
  return apiClient.patch<AiPromptTemplate>(
    AI_AGENT_ADMIN_ENDPOINTS.deactivatePromptTemplate(id)
  )
}

export async function listPromptVersions(
  params?: SearchAiPromptVersionsParams
): Promise<AiPromptVersionPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.promptVersions(params))
  return normalizeAiAdminPage<AiPromptVersion>(res)
}

export async function getPromptVersion(id: string): Promise<AiPromptVersion> {
  return apiClient.get<AiPromptVersion>(AI_AGENT_ADMIN_ENDPOINTS.promptVersion(id))
}

export async function createPromptVersion(
  body: CreateAiPromptVersionPayload
): Promise<AiPromptVersion> {
  return apiClient.post<AiPromptVersion>(AI_AGENT_ADMIN_ENDPOINTS.promptVersions(), body)
}

export async function updatePromptVersion(
  id: string,
  body: UpdateAiPromptVersionPayload
): Promise<AiPromptVersion> {
  return apiClient.put<AiPromptVersion>(AI_AGENT_ADMIN_ENDPOINTS.promptVersion(id), body)
}

export async function activatePromptVersion(id: string): Promise<AiPromptVersion> {
  return apiClient.patch<AiPromptVersion>(
    AI_AGENT_ADMIN_ENDPOINTS.activatePromptVersion(id)
  )
}

export async function archivePromptVersion(id: string): Promise<AiPromptVersion> {
  return apiClient.patch<AiPromptVersion>(
    AI_AGENT_ADMIN_ENDPOINTS.archivePromptVersion(id)
  )
}
