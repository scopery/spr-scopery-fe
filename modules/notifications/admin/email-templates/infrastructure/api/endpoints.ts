import { apiPath } from '@/shared/lib/api-paths'

export const ADMIN_EMAIL_TEMPLATE_ENDPOINTS = {
  list: () => apiPath('/notification/email-templates'),
  create: () => apiPath('/notification/email-templates'),
  get: (templateId: string) => apiPath(`/notification/email-templates/${templateId}`),
  update: (templateId: string) => apiPath(`/notification/email-templates/${templateId}`),
  activate: (templateId: string) =>
    apiPath(`/notification/email-templates/${templateId}/activate`),
  deactivate: (templateId: string) =>
    apiPath(`/notification/email-templates/${templateId}/deactivate`),
  delete: (templateId: string) =>
    apiPath(`/notification/email-templates/${templateId}`),
  versions: (templateId: string) =>
    apiPath(`/notification/email-templates/${templateId}/versions`),
  version: (templateId: string, versionId: string) =>
    apiPath(`/notification/email-templates/${templateId}/versions/${versionId}`),
  publishVersion: (templateId: string, versionId: string) =>
    apiPath(`/notification/email-templates/${templateId}/versions/${versionId}/publish`),
  preview: () => apiPath('/notification/email-templates/preview'),
} as const
