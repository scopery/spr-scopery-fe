export { EmailTemplatesView } from './presentation/ui/EmailTemplatesView'
export { useEmailTemplates } from './presentation/hooks/useEmailTemplates'
export * as emailTemplatesApi from './infrastructure/api/email-templates.api'
export type { EmailTemplate, EmailTemplateVersion, CreateEmailTemplatePayload } from './domain/model/email-template'
