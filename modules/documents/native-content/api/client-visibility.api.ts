import { apiClient } from '@/shared/lib/apiClient'
import { CLIENT_VISIBILITY_ENDPOINTS } from './intelligence.endpoints'
import type { ClientVisibilityValidation } from '../model/intelligence'
import type { ProjectDocument } from '@/modules/documents/document-hub/api/document-workbench.api'

export async function validateClientVisibility(
  projectId: string,
  documentId: string
): Promise<ClientVisibilityValidation> {
  return apiClient.post(CLIENT_VISIBILITY_ENDPOINTS.validate(projectId, documentId), {})
}

export async function enableClientVisibility(
  projectId: string,
  documentId: string
): Promise<ProjectDocument> {
  return apiClient.post(CLIENT_VISIBILITY_ENDPOINTS.enable(projectId, documentId), {})
}

export async function disableClientVisibility(
  projectId: string,
  documentId: string
): Promise<ProjectDocument> {
  return apiClient.post(CLIENT_VISIBILITY_ENDPOINTS.disable(projectId, documentId), {})
}
