import { apiClient } from '@/shared/lib/apiClient'
import { NOTIFICATION_ENDPOINTS } from './endpoints'
import type {
  EmailTemplate,
  EmailTemplateVersion,
  EmailRule,
  EmailDelivery,
  EmailOutbox,
  CreateEmailTemplatePayload,
  UpdateEmailTemplatePayload,
  CreateEmailTemplateVersionPayload,
  CreateEmailRulePayload,
  UpdateEmailRulePayload,
  SearchEmailTemplatesParams,
  SearchEmailRulesParams,
  SearchEmailDeliveriesParams,
  SearchEmailOutboxParams,
  AutomationRuleRaw,
} from '../../domain/model/notification'

function unwrapList<T>(res: T[] | { items: T[] }): T[] {
  return Array.isArray(res) ? res : res.items ?? []
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

// Email Templates
export async function createEmailTemplate(body: CreateEmailTemplatePayload): Promise<EmailTemplate> {
  return apiClient.post<EmailTemplate>(NOTIFICATION_ENDPOINTS.templates.create(), body)
}

export async function getEmailTemplate(id: string): Promise<EmailTemplate> {
  return apiClient.get<EmailTemplate>(NOTIFICATION_ENDPOINTS.templates.get(id))
}

export async function searchEmailTemplates(
  params?: SearchEmailTemplatesParams
): Promise<PageResponse<EmailTemplate>> {
  return apiClient.get<PageResponse<EmailTemplate>>(NOTIFICATION_ENDPOINTS.templates.search(params))
}

export async function updateEmailTemplate(
  id: string,
  body: UpdateEmailTemplatePayload
): Promise<EmailTemplate> {
  return apiClient.put<EmailTemplate>(NOTIFICATION_ENDPOINTS.templates.update(id), body)
}

export async function activateEmailTemplate(id: string): Promise<EmailTemplate> {
  return apiClient.patch<EmailTemplate>(NOTIFICATION_ENDPOINTS.templates.activate(id))
}

export async function deactivateEmailTemplate(id: string): Promise<EmailTemplate> {
  return apiClient.patch<EmailTemplate>(NOTIFICATION_ENDPOINTS.templates.deactivate(id))
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await apiClient.delete<void>(NOTIFICATION_ENDPOINTS.templates.delete(id), { parseJson: false })
}

export async function createEmailTemplateVersion(
  id: string,
  body: CreateEmailTemplateVersionPayload
): Promise<EmailTemplateVersion> {
  return apiClient.post<EmailTemplateVersion>(NOTIFICATION_ENDPOINTS.templates.createVersion(id), body)
}

export async function listEmailTemplateVersions(id: string): Promise<EmailTemplateVersion[]> {
  return apiClient.get<EmailTemplateVersion[]>(NOTIFICATION_ENDPOINTS.templates.listVersions(id))
}

export async function publishEmailTemplateVersion(
  id: string,
  versionId: string
): Promise<EmailTemplateVersion> {
  return apiClient.patch<EmailTemplateVersion>(
    NOTIFICATION_ENDPOINTS.templates.publishVersion(id, versionId)
  )
}

export async function previewEmailTemplate(
  versionId: string,
  samplePayload: Record<string, unknown>
): Promise<{ subject: string; htmlBody: string; textBody: string }> {
  return apiClient.post<{ subject: string; htmlBody: string; textBody: string }>(
    NOTIFICATION_ENDPOINTS.templates.preview(),
    { versionId, samplePayload }
  )
}

// Email Rules
export async function createEmailRule(body: CreateEmailRulePayload): Promise<EmailRule> {
  return apiClient.post<EmailRule>(NOTIFICATION_ENDPOINTS.rules.create(), body)
}

export async function getEmailRule(id: string): Promise<EmailRule> {
  return apiClient.get<EmailRule>(NOTIFICATION_ENDPOINTS.rules.get(id))
}

export async function searchEmailRules(params?: SearchEmailRulesParams): Promise<PageResponse<EmailRule>> {
  return apiClient.get<PageResponse<EmailRule>>(NOTIFICATION_ENDPOINTS.rules.search(params))
}

export async function updateEmailRule(id: string, body: UpdateEmailRulePayload): Promise<EmailRule> {
  return apiClient.put<EmailRule>(NOTIFICATION_ENDPOINTS.rules.update(id), body)
}

export async function activateEmailRule(id: string): Promise<EmailRule> {
  return apiClient.patch<EmailRule>(NOTIFICATION_ENDPOINTS.rules.activate(id))
}

export async function deactivateEmailRule(id: string): Promise<EmailRule> {
  return apiClient.patch<EmailRule>(NOTIFICATION_ENDPOINTS.rules.deactivate(id))
}

export async function enableEmailRule(id: string): Promise<EmailRule> {
  return apiClient.patch<EmailRule>(NOTIFICATION_ENDPOINTS.rules.enable(id))
}

export async function disableEmailRule(id: string): Promise<EmailRule> {
  return apiClient.patch<EmailRule>(NOTIFICATION_ENDPOINTS.rules.disable(id))
}

export async function deleteEmailRule(id: string): Promise<void> {
  await apiClient.delete<void>(NOTIFICATION_ENDPOINTS.rules.delete(id), { parseJson: false })
}

// Deliveries
export async function getEmailDelivery(id: string): Promise<EmailDelivery> {
  return apiClient.get<EmailDelivery>(NOTIFICATION_ENDPOINTS.deliveries.get(id))
}

export async function searchEmailDeliveries(
  params?: SearchEmailDeliveriesParams
): Promise<PageResponse<EmailDelivery>> {
  return apiClient.get<PageResponse<EmailDelivery>>(NOTIFICATION_ENDPOINTS.deliveries.search(params))
}

// Outbox
export async function getEmailOutbox(id: string): Promise<EmailOutbox> {
  return apiClient.get<EmailOutbox>(NOTIFICATION_ENDPOINTS.outbox.get(id))
}

export async function searchEmailOutbox(
  params?: SearchEmailOutboxParams
): Promise<PageResponse<EmailOutbox>> {
  return apiClient.get<PageResponse<EmailOutbox>>(NOTIFICATION_ENDPOINTS.outbox.search(params))
}

export async function retryEmailOutbox(id: string): Promise<EmailOutbox> {
  return apiClient.post<EmailOutbox>(NOTIFICATION_ENDPOINTS.outbox.retry(id), {})
}

// Automation rules — NAD-05. Schemas incomplete per WAVE2_API_CONTRACT §5.11 (list only).
export async function listReminderRules(workspaceId: string): Promise<AutomationRuleRaw[]> {
  const res = await apiClient.get<AutomationRuleRaw[] | { items: AutomationRuleRaw[] }>(
    NOTIFICATION_ENDPOINTS.automation.reminderRules(workspaceId)
  )
  return unwrapList(res)
}

export async function listAlertRules(workspaceId: string): Promise<AutomationRuleRaw[]> {
  const res = await apiClient.get<AutomationRuleRaw[] | { items: AutomationRuleRaw[] }>(
    NOTIFICATION_ENDPOINTS.automation.alertRules(workspaceId)
  )
  return unwrapList(res)
}

export async function listDigestRules(workspaceId: string): Promise<AutomationRuleRaw[]> {
  const res = await apiClient.get<AutomationRuleRaw[] | { items: AutomationRuleRaw[] }>(
    NOTIFICATION_ENDPOINTS.automation.digestRules(workspaceId)
  )
  return unwrapList(res)
}
