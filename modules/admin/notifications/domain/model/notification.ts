import type { EmailTemplateScope, EmailRecipientStrategy, EmailDeliveryStatus } from '../enums/notification.enum'

export interface EmailTemplateVersion {
  id: string
  templateId: string
  subjectTemplate: string
  htmlBodyTemplate: string
  textBodyTemplate: string | null
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  createdAt: string
}

export interface EmailTemplate {
  id: string
  code: string
  name: string
  description: string | null
  scope: EmailTemplateScope
  workspaceId: string | null
  eventDefinitionId: string
  status: 'ACTIVE' | 'INACTIVE'
  activeVersion: EmailTemplateVersion | null
  createdAt: string
  updatedAt: string
}

export interface CreateEmailTemplatePayload {
  code: string
  name: string
  description?: string
  scope: EmailTemplateScope
  workspaceId?: string
  eventDefinitionId: string
}

export interface UpdateEmailTemplatePayload {
  name: string
  description?: string
}

export interface CreateEmailTemplateVersionPayload {
  subjectTemplate: string
  htmlBodyTemplate: string
  textBodyTemplate?: string
}

export interface SearchEmailTemplatesParams {
  keyword?: string
  scope?: EmailTemplateScope
  status?: string
  workspaceId?: string
  eventDefinitionId?: string
  page?: number
  size?: number
}

export interface EmailRule {
  id: string
  code: string
  name: string
  description: string | null
  scope: EmailTemplateScope
  workspaceId: string | null
  eventDefinitionId: string
  templateId: string
  recipientStrategy: EmailRecipientStrategy
  recipientConfigJson: unknown | null
  priority: number
  status: 'ACTIVE' | 'INACTIVE'
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEmailRulePayload {
  code: string
  name: string
  description?: string
  scope: EmailTemplateScope
  workspaceId?: string
  eventDefinitionId: string
  templateId: string
  recipientStrategy: EmailRecipientStrategy
  recipientConfigJson?: unknown
  priority?: number
}

export interface UpdateEmailRulePayload {
  name: string
  description?: string
  recipientStrategy: EmailRecipientStrategy
  recipientConfigJson?: unknown
  priority?: number
}

export interface SearchEmailRulesParams {
  keyword?: string
  scope?: EmailTemplateScope
  status?: string
  workspaceId?: string
  eventDefinitionId?: string
  templateId?: string
  page?: number
  size?: number
}

export interface EmailDelivery {
  id: string
  ruleId: string
  templateId: string
  eventDefinitionId: string
  workspaceId: string | null
  status: EmailDeliveryStatus
  recipientCount: number
  createdAt: string
}

export interface SearchEmailDeliveriesParams {
  ruleId?: string
  templateId?: string
  eventDefinitionId?: string
  workspaceId?: string
  status?: EmailDeliveryStatus
  page?: number
  size?: number
}

export interface EmailOutbox {
  id: string
  deliveryId: string
  recipientAddress: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  providerType: string | null
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
}

export interface SearchEmailOutboxParams {
  deliveryId?: string
  status?: string
  providerType?: string
  page?: number
  size?: number
}

/**
 * Reminder / alert / digest rule shape — WAVE2_API_CONTRACT §5.11 lists only
 * `POST create, GET list` for these controllers with no documented response
 * schema. Kept intentionally loose (`id` + passthrough fields) until the
 * contract is completed; the UI renders these generically.
 */
export type AutomationRuleRaw = { id: string } & Record<string, unknown>
