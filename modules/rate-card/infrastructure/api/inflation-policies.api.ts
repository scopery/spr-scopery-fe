import { apiClient } from '@/shared/lib/apiClient'
import { RATE_CARD_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CreateInflationPolicyPayload,
  InflationPolicy,
  InflationPolicySearchParams,
  UpdateInflationPolicyPayload,
} from '../../domain/model/inflation-policy'

export async function listInflationPolicies(
  params?: InflationPolicySearchParams
): Promise<PageResponse<InflationPolicy>> {
  return apiClient.get<PageResponse<InflationPolicy>>(
    RATE_CARD_ENDPOINTS.inflationPolicies.list(params)
  )
}

export async function getInflationPolicy(policyId: string): Promise<InflationPolicy> {
  return apiClient.get<InflationPolicy>(RATE_CARD_ENDPOINTS.inflationPolicies.get(policyId))
}

export async function createInflationPolicy(
  body: CreateInflationPolicyPayload
): Promise<InflationPolicy> {
  return apiClient.post<InflationPolicy>(RATE_CARD_ENDPOINTS.inflationPolicies.create(), body)
}

export async function updateInflationPolicy(
  policyId: string,
  body: UpdateInflationPolicyPayload
): Promise<InflationPolicy> {
  return apiClient.put<InflationPolicy>(
    RATE_CARD_ENDPOINTS.inflationPolicies.update(policyId),
    body
  )
}

export async function activateInflationPolicy(policyId: string): Promise<InflationPolicy> {
  return apiClient.patch<InflationPolicy>(RATE_CARD_ENDPOINTS.inflationPolicies.activate(policyId))
}

export async function deactivateInflationPolicy(policyId: string): Promise<InflationPolicy> {
  return apiClient.patch<InflationPolicy>(
    RATE_CARD_ENDPOINTS.inflationPolicies.deactivate(policyId)
  )
}

export async function archiveInflationPolicy(policyId: string): Promise<InflationPolicy> {
  return apiClient.patch<InflationPolicy>(RATE_CARD_ENDPOINTS.inflationPolicies.archive(policyId))
}
