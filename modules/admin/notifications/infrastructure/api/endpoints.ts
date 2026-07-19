import { apiPath } from '@/shared/lib/api-paths'
import type {
  SearchEmailTemplatesParams,
  SearchEmailRulesParams,
  SearchEmailDeliveriesParams,
  SearchEmailOutboxParams,
} from '../../domain/model/notification'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const NOTIFICATION_ENDPOINTS = {
  templates: {
    create: () => apiPath('/notification/email-templates'),
    get: (id: string) => apiPath(`/notification/email-templates/${id}`),
    search: (params?: SearchEmailTemplatesParams) =>
      withQuery(apiPath('/notification/email-templates'), params as Record<string, string | number | boolean | undefined>),
    update: (id: string) => apiPath(`/notification/email-templates/${id}`),
    activate: (id: string) => apiPath(`/notification/email-templates/${id}/activate`),
    deactivate: (id: string) => apiPath(`/notification/email-templates/${id}/deactivate`),
    delete: (id: string) => apiPath(`/notification/email-templates/${id}`),
    createVersion: (id: string) => apiPath(`/notification/email-templates/${id}/versions`),
    listVersions: (id: string) => apiPath(`/notification/email-templates/${id}/versions`),
    publishVersion: (id: string, versionId: string) =>
      apiPath(`/notification/email-templates/${id}/versions/${versionId}/publish`),
    preview: () => apiPath('/notification/email-templates/preview'),
  },
  rules: {
    create: () => apiPath('/notification/email-rules'),
    get: (id: string) => apiPath(`/notification/email-rules/${id}`),
    search: (params?: SearchEmailRulesParams) =>
      withQuery(apiPath('/notification/email-rules'), params as Record<string, string | number | boolean | undefined>),
    update: (id: string) => apiPath(`/notification/email-rules/${id}`),
    activate: (id: string) => apiPath(`/notification/email-rules/${id}/activate`),
    deactivate: (id: string) => apiPath(`/notification/email-rules/${id}/deactivate`),
    enable: (id: string) => apiPath(`/notification/email-rules/${id}/enable`),
    disable: (id: string) => apiPath(`/notification/email-rules/${id}/disable`),
    delete: (id: string) => apiPath(`/notification/email-rules/${id}`),
  },
  deliveries: {
    get: (id: string) => apiPath(`/notification/email-deliveries/${id}`),
    search: (params?: SearchEmailDeliveriesParams) =>
      withQuery(apiPath('/notification/email-deliveries'), params as Record<string, string | number | boolean | undefined>),
  },
  outbox: {
    get: (id: string) => apiPath(`/notification/email-outbox/${id}`),
    search: (params?: SearchEmailOutboxParams) =>
      withQuery(apiPath('/notification/email-outbox'), params as Record<string, string | number | boolean | undefined>),
    retry: (id: string) => apiPath(`/notification/email-outbox/${id}/retry`),
  },
  automation: {
    reminderRules: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/notifications/reminder-rules`),
    alertRules: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/notifications/alert-rules`),
    digestRules: (workspaceId: string) =>
      apiPath(`/workspaces/${workspaceId}/notifications/digest-rules`),
  },
} as const
