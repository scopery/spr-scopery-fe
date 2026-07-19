import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { CreateFormPayload, CustomFormDefinition } from '../../domain/model/form'
import type { CustomFormVersion } from '../../domain/model/form-version'

export async function listForms(workspaceId: string): Promise<CustomFormDefinition[]> {
  return apiClient.get<CustomFormDefinition[]>(CONFIGURATION_ENDPOINTS.forms.list(workspaceId))
}

export async function getForm(
  workspaceId: string,
  formId: string
): Promise<CustomFormDefinition> {
  return apiClient.get<CustomFormDefinition>(
    CONFIGURATION_ENDPOINTS.forms.get(workspaceId, formId)
  )
}

export async function createForm(
  workspaceId: string,
  body: CreateFormPayload
): Promise<CustomFormDefinition> {
  return apiClient.post<CustomFormDefinition>(
    CONFIGURATION_ENDPOINTS.forms.create(workspaceId),
    body
  )
}

export async function listFormVersions(
  workspaceId: string,
  formId: string
): Promise<CustomFormVersion[]> {
  return apiClient.get<CustomFormVersion[]>(
    CONFIGURATION_ENDPOINTS.forms.versions.list(workspaceId, formId)
  )
}

export async function createFormVersion(
  workspaceId: string,
  formId: string
): Promise<CustomFormVersion> {
  return apiClient.post<CustomFormVersion>(
    CONFIGURATION_ENDPOINTS.forms.versions.create(workspaceId, formId)
  )
}

export async function publishFormVersion(
  workspaceId: string,
  formId: string,
  versionId: string
): Promise<CustomFormVersion> {
  return apiClient.post<CustomFormVersion>(
    CONFIGURATION_ENDPOINTS.forms.versions.publish(workspaceId, formId, versionId)
  )
}
