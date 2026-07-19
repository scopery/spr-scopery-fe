import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type {
  CreateCustomFieldPayload,
  CustomFieldDefinition,
} from '../../domain/model/custom-field'

export async function listCustomFields(workspaceId: string): Promise<CustomFieldDefinition[]> {
  return apiClient.get<CustomFieldDefinition[]>(
    CONFIGURATION_ENDPOINTS.customFields.list(workspaceId)
  )
}

export async function getCustomField(
  workspaceId: string,
  fieldId: string
): Promise<CustomFieldDefinition> {
  return apiClient.get<CustomFieldDefinition>(
    CONFIGURATION_ENDPOINTS.customFields.get(workspaceId, fieldId)
  )
}

export async function createCustomField(
  workspaceId: string,
  body: CreateCustomFieldPayload
): Promise<CustomFieldDefinition> {
  return apiClient.post<CustomFieldDefinition>(
    CONFIGURATION_ENDPOINTS.customFields.create(workspaceId),
    body
  )
}
