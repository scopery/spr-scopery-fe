import { apiClient } from '@/shared/lib/apiClient'
import { CONFIGURATION_ENDPOINTS } from './endpoints'
import type {
  CreateValidationRulePayload,
  CustomFieldValidationRule,
} from '../../domain/model/validation-rule'

export async function listValidationRules(
  workspaceId: string,
  fieldId: string
): Promise<CustomFieldValidationRule[]> {
  return apiClient.get<CustomFieldValidationRule[]>(
    CONFIGURATION_ENDPOINTS.validationRules.list(workspaceId, fieldId)
  )
}

export async function createValidationRule(
  workspaceId: string,
  fieldId: string,
  body: CreateValidationRulePayload
): Promise<CustomFieldValidationRule> {
  return apiClient.post<CustomFieldValidationRule>(
    CONFIGURATION_ENDPOINTS.validationRules.create(workspaceId, fieldId),
    body
  )
}

export async function deleteValidationRule(workspaceId: string, ruleId: string): Promise<void> {
  await apiClient.delete<void>(CONFIGURATION_ENDPOINTS.validationRules.delete(workspaceId, ruleId))
}
