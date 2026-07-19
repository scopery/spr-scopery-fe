import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { CreateFormFieldPayload, CustomFormField } from '../../domain/model/form-field'

export async function listFormFields(
  workspaceId: string,
  formId: string,
  versionId: string
): Promise<CustomFormField[]> {
  return apiClient.get<CustomFormField[]>(
    CONFIGURATION_ENDPOINTS.formFields.list(workspaceId, formId, versionId)
  )
}

export async function createFormField(
  workspaceId: string,
  formId: string,
  versionId: string,
  body: CreateFormFieldPayload
): Promise<CustomFormField> {
  return apiClient.post<CustomFormField>(
    CONFIGURATION_ENDPOINTS.formFields.create(workspaceId, formId, versionId),
    body
  )
}
