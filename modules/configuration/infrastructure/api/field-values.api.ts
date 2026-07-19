import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { CustomFieldValue, UpsertFieldValuesPayload } from '../../domain/model/field-value'

export async function getFieldValues(
  workspaceId: string,
  objectType: string,
  targetId: string
): Promise<CustomFieldValue[]> {
  return apiClient.get<CustomFieldValue[]>(
    CONFIGURATION_ENDPOINTS.fieldValues.get(workspaceId, objectType, targetId)
  )
}

export async function upsertFieldValues(
  workspaceId: string,
  body: UpsertFieldValuesPayload
): Promise<CustomFieldValue[]> {
  return apiClient.put<CustomFieldValue[]>(
    CONFIGURATION_ENDPOINTS.fieldValues.upsert(workspaceId),
    body
  )
}
