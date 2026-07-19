import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import { normalizeAiAdminPage } from '../../../infrastructure/api/page-response'
import type {
  AiUsagePolicy,
  AiUsagePolicyPage,
  CreateAiUsagePolicyPayload,
  SearchAiUsagePoliciesParams,
  UpdateAiUsagePolicyPayload,
} from '../../domain/model/usage-policy'

export async function listUsagePolicies(
  params?: SearchAiUsagePoliciesParams
): Promise<AiUsagePolicyPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.usagePolicies(params))
  return normalizeAiAdminPage<AiUsagePolicy>(res)
}

export async function getUsagePolicy(id: string): Promise<AiUsagePolicy> {
  return apiClient.get<AiUsagePolicy>(AI_AGENT_ADMIN_ENDPOINTS.usagePolicy(id))
}

export async function createUsagePolicy(
  body: CreateAiUsagePolicyPayload
): Promise<AiUsagePolicy> {
  return apiClient.post<AiUsagePolicy>(AI_AGENT_ADMIN_ENDPOINTS.usagePolicies(), body)
}

export async function updateUsagePolicy(
  id: string,
  body: UpdateAiUsagePolicyPayload
): Promise<AiUsagePolicy> {
  return apiClient.put<AiUsagePolicy>(AI_AGENT_ADMIN_ENDPOINTS.usagePolicy(id), body)
}

export async function activateUsagePolicy(id: string): Promise<AiUsagePolicy> {
  return apiClient.patch<AiUsagePolicy>(AI_AGENT_ADMIN_ENDPOINTS.activateUsagePolicy(id))
}

export async function deactivateUsagePolicy(id: string): Promise<AiUsagePolicy> {
  return apiClient.patch<AiUsagePolicy>(
    AI_AGENT_ADMIN_ENDPOINTS.deactivateUsagePolicy(id)
  )
}
