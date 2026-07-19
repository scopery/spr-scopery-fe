import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { CreateFieldOptionPayload, CustomFieldOption } from '../../domain/model/field-option'

export async function listFieldOptions(
  workspaceId: string,
  fieldId: string
): Promise<CustomFieldOption[]> {
  return apiClient.get<CustomFieldOption[]>(
    CONFIGURATION_ENDPOINTS.fieldOptions.list(workspaceId, fieldId)
  )
}

export async function createFieldOption(
  workspaceId: string,
  fieldId: string,
  body: CreateFieldOptionPayload
): Promise<CustomFieldOption> {
  return apiClient.post<CustomFieldOption>(
    CONFIGURATION_ENDPOINTS.fieldOptions.create(workspaceId, fieldId),
    body
  )
}

export async function archiveFieldOption(
  workspaceId: string,
  fieldId: string,
  optionId: string
): Promise<CustomFieldOption> {
  return apiClient.patch<CustomFieldOption>(
    CONFIGURATION_ENDPOINTS.fieldOptions.archive(workspaceId, fieldId, optionId)
  )
}
