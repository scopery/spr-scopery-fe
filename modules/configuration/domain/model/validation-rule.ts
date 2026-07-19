import type { ValidationRuleType } from '../enums/configuration.enum'

export interface CustomFieldValidationRule {
  id: string
  customFieldDefinitionId: string
  ruleType: ValidationRuleType | string
  ruleConfigJson: string | null
  status: string
}

export interface CreateValidationRulePayload {
  ruleType: string
  ruleConfigJson?: string
}
