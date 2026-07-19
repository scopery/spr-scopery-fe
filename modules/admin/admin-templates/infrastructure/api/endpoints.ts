import { apiPath } from '@/shared/lib/api-paths'

export const TEMPLATE_ENDPOINTS = {
  list: (params?: { status?: string; limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath('/templates') + (q ? `?${q}` : '')
  },
  get: (templateId: string) => apiPath(`/templates/${templateId}`),
} as const

export const ADMIN_ENDPOINTS = {
  templates: () => apiPath('/admin/templates'),
  template: (templateId: string) => apiPath(`/admin/templates/${templateId}`),
  templateQuestions: (templateId: string) => apiPath(`/admin/templates/${templateId}/questions`),
  templatePublish: (templateId: string) => apiPath(`/admin/templates/${templateId}/publish`),
  templateDuplicate: (templateId: string) => apiPath(`/admin/templates/${templateId}/duplicate`),
  question: (questionId: string) => apiPath(`/admin/questions/${questionId}`),
} as const
