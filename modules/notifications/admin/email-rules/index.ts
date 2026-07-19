export { EmailRulesView } from './presentation/ui/EmailRulesView'
export { useEmailRules } from './presentation/hooks/useEmailRules'
export * as emailRulesApi from './infrastructure/api/email-rules.api'
export type { EmailRule, CreateEmailRulePayload, UpdateEmailRulePayload } from './domain/model/email-rule'
