import { apiClient } from '@/shared/lib/apiClient'
import { AUTOMATION_ENDPOINTS } from './endpoints'
import type { ReminderRule, CreateReminderRulePayload } from '../../domain/model/reminder-rule'
import type { AlertRule, CreateAlertRulePayload } from '../../domain/model/alert-rule'
import type { DigestRule, CreateDigestRulePayload } from '../../domain/model/digest-rule'
import type { DigestRun } from '../../domain/model/digest-run'

export async function listReminderRules(workspaceId: string): Promise<ReminderRule[]> {
  return apiClient.get<ReminderRule[]>(AUTOMATION_ENDPOINTS.reminderRules.list(workspaceId))
}

export async function createReminderRule(
  workspaceId: string,
  body: CreateReminderRulePayload,
): Promise<ReminderRule> {
  return apiClient.post<ReminderRule>(AUTOMATION_ENDPOINTS.reminderRules.create(workspaceId), body)
}

export async function listAlertRules(workspaceId: string): Promise<AlertRule[]> {
  return apiClient.get<AlertRule[]>(AUTOMATION_ENDPOINTS.alertRules.list(workspaceId))
}

export async function createAlertRule(
  workspaceId: string,
  body: CreateAlertRulePayload,
): Promise<AlertRule> {
  return apiClient.post<AlertRule>(AUTOMATION_ENDPOINTS.alertRules.create(workspaceId), body)
}

export async function listDigestRules(workspaceId: string): Promise<DigestRule[]> {
  return apiClient.get<DigestRule[]>(AUTOMATION_ENDPOINTS.digestRules.list(workspaceId))
}

export async function createDigestRule(
  workspaceId: string,
  body: CreateDigestRulePayload,
): Promise<DigestRule> {
  return apiClient.post<DigestRule>(AUTOMATION_ENDPOINTS.digestRules.create(workspaceId), body)
}

export async function listDigestRuns(workspaceId: string): Promise<DigestRun[]> {
  return apiClient.get<DigestRun[]>(AUTOMATION_ENDPOINTS.digestRuns.list(workspaceId))
}
