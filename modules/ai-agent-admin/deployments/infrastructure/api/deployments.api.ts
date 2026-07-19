import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiModelDeployment,
  AiModelDeploymentPage,
  CreateAiModelDeploymentPayload,
  SearchAiModelDeploymentsParams,
  UpdateAiModelDeploymentPayload,
} from '../../domain/model/deployment'

export async function listDeployments(
  params?: SearchAiModelDeploymentsParams
): Promise<AiModelDeploymentPage> {
  const res = await apiClient.get<unknown>(
    AI_AGENT_ADMIN_ENDPOINTS.modelDeployments({
      ...params,
      isDefault:
        params?.isDefault === '' || params?.isDefault == null
          ? undefined
          : params.isDefault,
    })
  )
  return normalizeAiAdminPage<AiModelDeployment>(res)
}

export async function getDeployment(id: string): Promise<AiModelDeployment> {
  return apiClient.get<AiModelDeployment>(AI_AGENT_ADMIN_ENDPOINTS.modelDeployment(id))
}

export async function createDeployment(
  body: CreateAiModelDeploymentPayload
): Promise<AiModelDeployment> {
  return apiClient.post<AiModelDeployment>(
    AI_AGENT_ADMIN_ENDPOINTS.modelDeployments(),
    body
  )
}

export async function updateDeployment(
  id: string,
  body: UpdateAiModelDeploymentPayload
): Promise<AiModelDeployment> {
  return apiClient.put<AiModelDeployment>(
    AI_AGENT_ADMIN_ENDPOINTS.modelDeployment(id),
    body
  )
}

export async function activateDeployment(id: string): Promise<AiModelDeployment> {
  return apiClient.patch<AiModelDeployment>(
    AI_AGENT_ADMIN_ENDPOINTS.activateModelDeployment(id)
  )
}

export async function deactivateDeployment(id: string): Promise<AiModelDeployment> {
  return apiClient.patch<AiModelDeployment>(
    AI_AGENT_ADMIN_ENDPOINTS.deactivateModelDeployment(id)
  )
}

export async function setDefaultDeployment(id: string): Promise<AiModelDeployment> {
  return apiClient.patch<AiModelDeployment>(
    AI_AGENT_ADMIN_ENDPOINTS.setDefaultModelDeployment(id)
  )
}
