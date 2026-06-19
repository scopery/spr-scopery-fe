import { v2 } from '@/shared/lib/api-paths'

export const TEMPLATE_ENDPOINTS = {
  list: (params?: { status?: string; limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2('/templates') + (q ? `?${q}` : '')
  },
  get: (templateId: string) => v2(`/templates/${templateId}`),
} as const

export const ADMIN_ENDPOINTS = {
  templates: () => v2('/admin/templates'),
  template: (templateId: string) => v2(`/admin/templates/${templateId}`),
  templateQuestions: (templateId: string) => v2(`/admin/templates/${templateId}/questions`),
  templatePublish: (templateId: string) => v2(`/admin/templates/${templateId}/publish`),
  templateDuplicate: (templateId: string) => v2(`/admin/templates/${templateId}/duplicate`),
  question: (questionId: string) => v2(`/admin/questions/${questionId}`),
} as const
