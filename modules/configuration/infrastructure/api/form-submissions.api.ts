import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type { FormSubmission, SubmitFormPayload } from '../../domain/model/form-submission'

export async function submitForm(
  workspaceId: string,
  formId: string,
  body: SubmitFormPayload
): Promise<FormSubmission> {
  return apiClient.post<FormSubmission>(
    CONFIGURATION_ENDPOINTS.formSubmissions.submit(workspaceId, formId),
    body
  )
}

export async function listFormSubmissions(workspaceId: string): Promise<FormSubmission[]> {
  return apiClient.get<FormSubmission[]>(
    CONFIGURATION_ENDPOINTS.formSubmissions.list(workspaceId)
  )
}

export async function getFormSubmission(
  workspaceId: string,
  submissionId: string
): Promise<FormSubmission> {
  return apiClient.get<FormSubmission>(
    CONFIGURATION_ENDPOINTS.formSubmissions.get(workspaceId, submissionId)
  )
}
