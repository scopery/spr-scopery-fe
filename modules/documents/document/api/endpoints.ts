import { v2 } from '@/shared/lib/api-paths'

export const DOCUMENT_ENDPOINTS = {
  listOrg: (
    orgId: string,
    params?: { q?: string; exclude_project_id?: string; limit?: number; offset?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.exclude_project_id) p.set('exclude_project_id', params.exclude_project_id)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents`) + (q ? `?${q}` : '')
  },
  createOrg: (orgId: string) => v2(`/orgs/${orgId}/documents`),
  get: (orgId: string, documentId: string) => v2(`/orgs/${orgId}/documents/${documentId}`),
  update: (orgId: string, documentId: string, projectId?: string) => {
    const base = v2(`/orgs/${orgId}/documents/${documentId}`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  archive: (orgId: string, documentId: string, projectId?: string) => {
    const base = v2(`/orgs/${orgId}/documents/${documentId}/archive`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  restore: (orgId: string, documentId: string, projectId?: string) => {
    const base = v2(`/orgs/${orgId}/documents/${documentId}/restore`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  listProject: (
    orgId: string,
    projectId: string,
    params?: {
      q?: string
      document_type?: string
      pinned_only?: boolean
      status?: string
      workflow_status?: string
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.document_type) p.set('document_type', params.document_type)
    if (params?.pinned_only != null) p.set('pinned_only', String(params.pinned_only))
    if (params?.status) p.set('status', params.status)
    if (params?.workflow_status) p.set('workflow_status', params.workflow_status)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects/${projectId}/documents`) + (q ? `?${q}` : '')
  },
  createProject: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents`),
  attach: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/attach`),
  detach: (orgId: string, projectId: string, documentId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/${documentId}`),
  pin: (orgId: string, projectId: string, documentId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/${documentId}/pin`),
  createFromTemplate: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/from-template`),
  listDeliverableTemplates: (
    orgId: string,
    projectId: string,
    params?: { deliverable_type?: string; source_entity_type?: string }
  ) => {
    const p = new URLSearchParams()
    if (params?.deliverable_type) p.set('deliverable_type', params.deliverable_type)
    if (params?.source_entity_type) p.set('source_entity_type', params.source_entity_type)
    const q = p.toString()
    return (
      v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/templates`) +
      (q ? `?${q}` : '')
    )
  },
  deliverableContext: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/context`),
  previewDeliverable: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/preview`),
  createDeliverable: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables`),
  deliverablePicker: (
    orgId: string,
    projectId: string,
    params?: {
      q?: string
      document_type?: string
      workflow_status?: string
      status?: 'active' | 'archived'
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.document_type) p.set('document_type', params.document_type)
    if (params?.workflow_status) p.set('workflow_status', params.workflow_status)
    if (params?.status) p.set('status', params.status)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return (
      v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/picker`) + (q ? `?${q}` : '')
    )
  },
  deliverableHistory: (
    orgId: string,
    projectId: string,
    params?: {
      status?: 'active' | 'archived'
      document_type?: string
      workflow_status?: string
      readiness_status?: string
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.document_type) p.set('document_type', params.document_type)
    if (params?.workflow_status) p.set('workflow_status', params.workflow_status)
    if (params?.readiness_status) p.set('readiness_status', params.readiness_status)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return (
      v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/history`) + (q ? `?${q}` : '')
    )
  },
  deliverableMetadata: (orgId: string, documentId: string, projectId?: string) => {
    const base = v2(`/orgs/${orgId}/documents/${documentId}/deliverable-metadata`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  refreshDeliverableReadiness: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/deliverable-readiness/refresh`),
  listLinks: (orgId: string, documentId: string, projectId?: string) => {
    const base = v2(`/orgs/${orgId}/documents/${documentId}/links`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  createLink: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/links`),
  archiveLink: (orgId: string, documentId: string, linkId: string, projectId?: string) => {
    const base = v2(`/orgs/${orgId}/documents/${documentId}/links/${linkId}/archive`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  restoreLink: (orgId: string, documentId: string, linkId: string, projectId?: string) => {
    const base = v2(`/orgs/${orgId}/documents/${documentId}/links/${linkId}/restore`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  linkCounts: (orgId: string, documentIds: string[]) => {
    const p = new URLSearchParams()
    p.set('document_ids', documentIds.join(','))
    return v2(`/orgs/${orgId}/document-links/link-counts?${p.toString()}`)
  },
  entityLinkCounts: (
    orgId: string,
    params: {
      linked_entity_type: string
      project_id: string
      session_id?: string
      linked_entity_ids: string[]
    }
  ) => {
    const p = new URLSearchParams()
    p.set('linked_entity_type', params.linked_entity_type)
    p.set('project_id', params.project_id)
    p.set('linked_entity_ids', params.linked_entity_ids.join(','))
    if (params.session_id) p.set('session_id', params.session_id)
    return v2(`/orgs/${orgId}/document-links/entity-link-counts?${p.toString()}`)
  },
  bulkCreate: (orgId: string) => v2(`/orgs/${orgId}/document-links/bulk`),
  exportDocument: (
    orgId: string,
    documentId: string,
    params?: { format?: string; project_id?: string }
  ) => {
    const p = new URLSearchParams()
    if (params?.format) p.set('format', params.format)
    if (params?.project_id) p.set('project_id', params.project_id)
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/export`) + (q ? `?${q}` : '')
  },
  exportDocuments: (orgId: string) => v2(`/orgs/${orgId}/documents/export`),
  exportDocumentHub: (orgId: string) => v2(`/orgs/${orgId}/document-hub/export`),
  previewDocumentHubExport: (orgId: string) => v2(`/orgs/${orgId}/document-hub/export/preview`),
  exportRequirementEvidence: (orgId: string, projectId: string, requirementId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}/evidence/export`),
  exportSessionEvidence: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/evidence/export`),
  exportProjectHandoff: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/handoff/export`),
  byEntity: (
    orgId: string,
    params: {
      linked_entity_type: string
      linked_entity_id: string
      project_id?: string
      session_id?: string
      relation_type?: string
      document_status?: 'active' | 'archived'
      workflow_status?: string
      include_archived_links?: boolean
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    p.set('linked_entity_type', params.linked_entity_type)
    p.set('linked_entity_id', params.linked_entity_id)
    if (params.project_id) p.set('project_id', params.project_id)
    if (params.session_id) p.set('session_id', params.session_id)
    if (params.relation_type) p.set('relation_type', params.relation_type)
    if (params.document_status) p.set('document_status', params.document_status)
    if (params.workflow_status) p.set('workflow_status', params.workflow_status)
    if (params.include_archived_links) p.set('include_archived_links', 'true')
    if (params.limit != null) p.set('limit', String(params.limit))
    if (params.offset != null) p.set('offset', String(params.offset))
    return v2(`/orgs/${orgId}/document-links/by-entity?${p.toString()}`)
  },
  grouped: (
    orgId: string,
    projectId: string,
    params?: {
      q?: string
      document_type?: string
      section_id?: string
      pinned_only?: boolean
      status?: 'active' | 'archived'
      workflow_status?: 'draft' | 'in_review' | 'approved'
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.document_type) p.set('document_type', params.document_type)
    if (params?.section_id) p.set('section_id', params.section_id)
    if (params?.pinned_only != null) p.set('pinned_only', String(params.pinned_only))
    if (params?.status) p.set('status', params.status)
    if (params?.workflow_status) p.set('workflow_status', params.workflow_status)
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects/${projectId}/documents/grouped`) + (q ? `?${q}` : '')
  },
  moveToSection: (orgId: string, projectId: string, documentId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/${documentId}/section`),
  reorderInSection: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/documents/reorder-in-section`),
} as const
