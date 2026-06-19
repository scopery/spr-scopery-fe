import { v2 } from '@/shared/lib/api-paths'

export const DOCUMENT_TEMPLATE_ENDPOINTS = {
  list: (
    orgId: string,
    params?: { q?: string; document_type?: string; scope?: string; limit?: number; offset?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.document_type) p.set('document_type', params.document_type)
    if (params?.scope) p.set('scope', params.scope)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/document-templates`) + (q ? `?${q}` : '')
  },
  management: (
    orgId: string,
    params?: {
      q?: string
      document_type?: string
      scope?: string
      status?: string
      category?: string
      sort?: string
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.document_type) p.set('document_type', params.document_type)
    if (params?.scope) p.set('scope', params.scope)
    if (params?.status) p.set('status', params.status)
    if (params?.category) p.set('category', params.category)
    if (params?.sort) p.set('sort', params.sort)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/document-templates/management`) + (q ? `?${q}` : '')
  },
  get: (orgId: string, templateId: string) => v2(`/orgs/${orgId}/document-templates/${templateId}`),
  create: (orgId: string) => v2(`/orgs/${orgId}/document-templates`),
  update: (orgId: string, templateId: string) =>
    v2(`/orgs/${orgId}/document-templates/${templateId}`),
  archive: (orgId: string, templateId: string) =>
    v2(`/orgs/${orgId}/document-templates/${templateId}/archive`),
  publish: (orgId: string, templateId: string) =>
    v2(`/orgs/${orgId}/document-templates/${templateId}/publish`),
  unpublish: (orgId: string, templateId: string) =>
    v2(`/orgs/${orgId}/document-templates/${templateId}/unpublish`),
  duplicate: (orgId: string, templateId: string) =>
    v2(`/orgs/${orgId}/document-templates/${templateId}/duplicate`),
  createDocument: (orgId: string) => v2(`/orgs/${orgId}/document-templates/create-document`),
  variables: (orgId: string) => v2(`/orgs/${orgId}/document-templates/variables`),
  previewVariables: (
    orgId: string,
    templateId: string,
    params?: {
      project_id?: string
      session_id?: string
      document_title?: string
      mode?: 'preview' | 'create_document'
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.session_id) p.set('session_id', params.session_id)
    if (params?.document_title) p.set('document_title', params.document_title)
    if (params?.mode) p.set('mode', params.mode)
    const q = p.toString()
    return (
      v2(`/orgs/${orgId}/document-templates/${templateId}/preview-variables`) + (q ? `?${q}` : '')
    )
  },
} as const
