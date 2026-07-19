import { apiPath } from '@/shared/lib/api-paths'

export const ADMIN_EMAIL_RULE_ENDPOINTS = {
  list: () => apiPath('/notification/email-rules'),
  create: () => apiPath('/notification/email-rules'),
  get: (ruleId: string) => apiPath(`/notification/email-rules/${ruleId}`),
  update: (ruleId: string) => apiPath(`/notification/email-rules/${ruleId}`),
  activate: (ruleId: string) => apiPath(`/notification/email-rules/${ruleId}/activate`),
  deactivate: (ruleId: string) => apiPath(`/notification/email-rules/${ruleId}/deactivate`),
  enable: (ruleId: string) => apiPath(`/notification/email-rules/${ruleId}/enable`),
  disable: (ruleId: string) => apiPath(`/notification/email-rules/${ruleId}/disable`),
  delete: (ruleId: string) => apiPath(`/notification/email-rules/${ruleId}`),
} as const
