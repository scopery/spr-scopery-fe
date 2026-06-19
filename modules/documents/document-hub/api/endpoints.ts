import { v2 } from '@/shared/lib/api-paths'

export const DOCUMENT_HUB_ENDPOINTS = {
  list: (
    orgId: string,
    params?: {
      project_id?: string
      search?: string
      document_type?: string
      origin_type?: string
      generated_by_ai?: boolean
      section_id?: string
      sort?: string
      status?: 'active' | 'archived'
      workflow_status?: 'draft' | 'in_review' | 'approved'
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.search) p.set('search', params.search)
    if (params?.document_type) p.set('document_type', params.document_type)
    if (params?.origin_type) p.set('origin_type', params.origin_type)
    if (params?.generated_by_ai != null) p.set('generated_by_ai', String(params.generated_by_ai))
    if (params?.section_id) p.set('section_id', params.section_id)
    if (params?.status) p.set('status', params.status)
    if (params?.workflow_status) p.set('workflow_status', params.workflow_status)
    if (params?.sort) p.set('sort', params.sort)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/document-hub`) + (q ? `?${q}` : '')
  },
  deliverableContext: (orgId: string, selectedDocumentIds: string[]) => {
    const p = new URLSearchParams()
    if (selectedDocumentIds.length) p.set('selected_document_ids', selectedDocumentIds.join(','))
    const q = p.toString()
    return v2(`/orgs/${orgId}/document-hub/deliverables/context`) + (q ? `?${q}` : '')
  },
  resolveDeliverableSelection: (orgId: string) =>
    v2(`/orgs/${orgId}/document-hub/deliverables/resolve-selection`),
} as const
