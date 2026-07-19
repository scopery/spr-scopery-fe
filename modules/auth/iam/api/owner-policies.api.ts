import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type {
  CreateOwnerPolicyPayload,
  IamOwnerPolicy,
  IamPageResponse,
  SearchOwnerPoliciesParams,
} from '../model'

export async function listOwnerPolicies(
  params?: SearchOwnerPoliciesParams
): Promise<IamPageResponse<IamOwnerPolicy>> {
  return apiClient.get<IamPageResponse<IamOwnerPolicy>>(IAM_ENDPOINTS.ownerPolicies.list(params))
}

export async function getOwnerPolicy(policyId: string): Promise<IamOwnerPolicy> {
  return apiClient.get<IamOwnerPolicy>(IAM_ENDPOINTS.ownerPolicies.get(policyId))
}

export async function createOwnerPolicy(body: CreateOwnerPolicyPayload): Promise<IamOwnerPolicy> {
  return apiClient.post<IamOwnerPolicy>(IAM_ENDPOINTS.ownerPolicies.create(), body)
}
