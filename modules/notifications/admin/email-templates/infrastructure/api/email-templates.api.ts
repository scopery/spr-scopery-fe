import { apiClient } from '@/shared/lib/apiClient'
import { ADMIN_EMAIL_TEMPLATE_ENDPOINTS } from './endpoints'
import type {
  CreateEmailTemplatePayload,
  CreateTemplateVersionPayload,
  EmailTemplate,
  EmailTemplateVersion,
  UpdateEmailTemplatePayload,
} from '../../domain/model/email-template'

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  return apiClient.get<EmailTemplate[]>(ADMIN_EMAIL_TEMPLATE_ENDPOINTS.list())
}

export async function getEmailTemplate(templateId: string): Promise<EmailTemplate> {
  return apiClient.get<EmailTemplate>(ADMIN_EMAIL_TEMPLATE_ENDPOINTS.get(templateId))
}

export async function createEmailTemplate(
  body: CreateEmailTemplatePayload
): Promise<EmailTemplate> {
  return apiClient.post<EmailTemplate>(ADMIN_EMAIL_TEMPLATE_ENDPOINTS.create(), body)
}

export async function updateEmailTemplate(
  templateId: string,
  body: UpdateEmailTemplatePayload
): Promise<EmailTemplate> {
  return apiClient.patch<EmailTemplate>(ADMIN_EMAIL_TEMPLATE_ENDPOINTS.update(templateId), body)
}

export async function activateEmailTemplate(templateId: string): Promise<EmailTemplate> {
  return apiClient.post<EmailTemplate>(ADMIN_EMAIL_TEMPLATE_ENDPOINTS.activate(templateId))
}

export async function deactivateEmailTemplate(templateId: string): Promise<EmailTemplate> {
  return apiClient.post<EmailTemplate>(ADMIN_EMAIL_TEMPLATE_ENDPOINTS.deactivate(templateId))
}

export async function deleteEmailTemplate(templateId: string): Promise<void> {
  await apiClient.delete<void>(ADMIN_EMAIL_TEMPLATE_ENDPOINTS.delete(templateId), {
    parseJson: false,
  })
}

export async function listTemplateVersions(templateId: string): Promise<EmailTemplateVersion[]> {
  return apiClient.get<EmailTemplateVersion[]>(
    ADMIN_EMAIL_TEMPLATE_ENDPOINTS.versions(templateId)
  )
}

export async function createTemplateVersion(
  templateId: string,
  body: CreateTemplateVersionPayload
): Promise<EmailTemplateVersion> {
  return apiClient.post<EmailTemplateVersion>(
    ADMIN_EMAIL_TEMPLATE_ENDPOINTS.versions(templateId),
    body
  )
}

export async function publishTemplateVersion(
  templateId: string,
  versionId: string
): Promise<EmailTemplateVersion> {
  return apiClient.post<EmailTemplateVersion>(
    ADMIN_EMAIL_TEMPLATE_ENDPOINTS.publishVersion(templateId, versionId)
  )
}
