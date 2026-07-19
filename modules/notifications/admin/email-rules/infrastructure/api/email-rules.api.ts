import { apiClient } from '@/shared/lib/apiClient'
import { ADMIN_EMAIL_RULE_ENDPOINTS } from './endpoints'
import type { CreateEmailRulePayload, EmailRule, UpdateEmailRulePayload } from '../../domain/model/email-rule'

export async function listEmailRules(): Promise<EmailRule[]> {
  return apiClient.get<EmailRule[]>(ADMIN_EMAIL_RULE_ENDPOINTS.list())
}

export async function createEmailRule(body: CreateEmailRulePayload): Promise<EmailRule> {
  return apiClient.post<EmailRule>(ADMIN_EMAIL_RULE_ENDPOINTS.create(), body)
}

export async function updateEmailRule(ruleId: string, body: UpdateEmailRulePayload): Promise<EmailRule> {
  return apiClient.patch<EmailRule>(ADMIN_EMAIL_RULE_ENDPOINTS.update(ruleId), body)
}

export async function activateEmailRule(ruleId: string): Promise<EmailRule> {
  return apiClient.post<EmailRule>(ADMIN_EMAIL_RULE_ENDPOINTS.activate(ruleId))
}

export async function deactivateEmailRule(ruleId: string): Promise<EmailRule> {
  return apiClient.post<EmailRule>(ADMIN_EMAIL_RULE_ENDPOINTS.deactivate(ruleId))
}

export async function enableEmailRule(ruleId: string): Promise<EmailRule> {
  return apiClient.post<EmailRule>(ADMIN_EMAIL_RULE_ENDPOINTS.enable(ruleId))
}

export async function disableEmailRule(ruleId: string): Promise<EmailRule> {
  return apiClient.post<EmailRule>(ADMIN_EMAIL_RULE_ENDPOINTS.disable(ruleId))
}

export async function deleteEmailRule(ruleId: string): Promise<void> {
  await apiClient.delete<void>(ADMIN_EMAIL_RULE_ENDPOINTS.delete(ruleId), { parseJson: false })
}
