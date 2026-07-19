import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type {
  FieldVisibilityPolicy,
  SetFieldVisibilityPayload,
} from '../../domain/model/field-visibility'

export async function listFieldVisibilityPolicies(
  workspaceId: string,
  fieldId: string
): Promise<FieldVisibilityPolicy[]> {
  return apiClient.get<FieldVisibilityPolicy[]>(
    CONFIGURATION_ENDPOINTS.fieldVisibility.list(workspaceId, fieldId)
  )
}

export async function setFieldVisibilityPolicy(
  workspaceId: string,
  fieldId: string,
  body: SetFieldVisibilityPayload
): Promise<FieldVisibilityPolicy> {
  return apiClient.put<FieldVisibilityPolicy>(
    CONFIGURATION_ENDPOINTS.fieldVisibility.set(workspaceId, fieldId),
    body
  )
}
