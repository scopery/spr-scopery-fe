import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { CreateFormSectionPayload, CustomFormSection } from '../../domain/model/form-section'

export async function listFormSections(
  workspaceId: string,
  formId: string,
  versionId: string
): Promise<CustomFormSection[]> {
  return apiClient.get<CustomFormSection[]>(
    CONFIGURATION_ENDPOINTS.formSections.list(workspaceId, formId, versionId)
  )
}

export async function createFormSection(
  workspaceId: string,
  formId: string,
  versionId: string,
  body: CreateFormSectionPayload
): Promise<CustomFormSection> {
  return apiClient.post<CustomFormSection>(
    CONFIGURATION_ENDPOINTS.formSections.create(workspaceId, formId, versionId),
    body
  )
}
