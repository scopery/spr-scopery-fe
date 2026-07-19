import { apiClient } from '@/shared/lib/apiClient'
import { NATIVE_TEMPLATE_ENDPOINTS } from './reusable-content.endpoints'
import type { DocumentContentResponse } from '../model/document-content'
import type {
  InstantiateNativeTemplateBody,
  PublishNativeTemplateVersionBody,
} from '../model/reusable-content'

export async function publishNativeTemplateVersion(
  workspaceId: string,
  templateId: string,
  body: PublishNativeTemplateVersionBody
): Promise<{ id: string; templateId?: string; versionNumber?: number; status?: string }> {
  return apiClient.post(
    NATIVE_TEMPLATE_ENDPOINTS.publishNativeVersion(workspaceId, templateId),
    body
  )
}

export async function instantiateNativeTemplate(
  workspaceId: string,
  templateId: string,
  versionId: string,
  body: InstantiateNativeTemplateBody
): Promise<DocumentContentResponse> {
  return apiClient.post(
    NATIVE_TEMPLATE_ENDPOINTS.instantiate(workspaceId, templateId, versionId),
    body
  )
}
