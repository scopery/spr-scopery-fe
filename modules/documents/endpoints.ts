import { apiPath } from '@/shared/lib/api-paths'

/**
 * Documents
 * Description: Full document lifecycle at org and project scope: CRUD, attach/detach,
 *              pin, deliverables, document links, bulk operations, exports, and section ordering.
 */
export const DOCUMENT_ENDPOINTS = {
  /* --- Org documents --- */
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
    return apiPath(`/workspaces/${orgId}/documents`) + (q ? `?${q}` : '')
  },
  createOrg: (orgId: string) => apiPath(`/workspaces/${orgId}/documents`),
  /** @deprecated Workspace-scoped get — BE Document Hub is project-scoped. Prefer getProject. */
  get: (orgId: string, documentId: string) => apiPath(`/workspaces/${orgId}/documents/${documentId}`),
  getProject: (projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}`),
  update: (orgId: string, documentId: string, projectId?: string) => {
    const base = apiPath(`/workspaces/${orgId}/documents/${documentId}`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  archive: (orgId: string, documentId: string, projectId?: string) => {
    const base = apiPath(`/workspaces/${orgId}/documents/${documentId}/archive`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  restore: (orgId: string, documentId: string, projectId?: string) => {
    const base = apiPath(`/workspaces/${orgId}/documents/${documentId}/restore`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },

  /* --- Project documents --- */
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
    return apiPath(`/projects/${projectId}/documents`) + (q ? `?${q}` : '')
  },
  createProject: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents`),
  attach: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents/attach`),
  detach: (orgId: string, projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}`),
  pin: (orgId: string, projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/pin`),
  createFromTemplate: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents/from-template`),
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
    return apiPath(`/projects/${projectId}/documents/grouped`) + (q ? `?${q}` : '')
  },
  moveToSection: (orgId: string, projectId: string, documentId: string) =>
    apiPath(`/projects/${projectId}/documents/${documentId}/section`),
  reorderInSection: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents/reorder-in-section`),

  /* --- Deliverables --- */
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
      apiPath(`/projects/${projectId}/documents/deliverables/templates`) +
      (q ? `?${q}` : '')
    )
  },
  deliverableContext: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents/deliverables/context`),
  previewDeliverable: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents/deliverables/preview`),
  createDeliverable: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents/deliverables`),
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
      apiPath(`/projects/${projectId}/documents/deliverables/picker`) + (q ? `?${q}` : '')
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
      apiPath(`/projects/${projectId}/documents/deliverables/history`) + (q ? `?${q}` : '')
    )
  },
  deliverableMetadata: (orgId: string, documentId: string, projectId?: string) => {
    const base = apiPath(`/workspaces/${orgId}/documents/${documentId}/deliverable-metadata`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  refreshDeliverableReadiness: (orgId: string, documentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/deliverable-readiness/refresh`),

  /* --- Links --- */
  listLinks: (orgId: string, documentId: string, projectId?: string) => {
    const base = apiPath(`/workspaces/${orgId}/documents/${documentId}/links`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  createLink: (orgId: string, documentId: string) =>
    apiPath(`/workspaces/${orgId}/documents/${documentId}/links`),
  archiveLink: (orgId: string, documentId: string, linkId: string, projectId?: string) => {
    const base = apiPath(`/workspaces/${orgId}/documents/${documentId}/links/${linkId}/archive`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  restoreLink: (orgId: string, documentId: string, linkId: string, projectId?: string) => {
    const base = apiPath(`/workspaces/${orgId}/documents/${documentId}/links/${linkId}/restore`)
    if (projectId) return `${base}?project_id=${encodeURIComponent(projectId)}`
    return base
  },
  linkCounts: (orgId: string, documentIds: string[]) => {
    const p = new URLSearchParams()
    p.set('document_ids', documentIds.join(','))
    return apiPath(`/workspaces/${orgId}/document-links/link-counts?${p.toString()}`)
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
    return apiPath(`/workspaces/${orgId}/document-links/entity-link-counts?${p.toString()}`)
  },
  bulkCreate: (orgId: string) => apiPath(`/workspaces/${orgId}/document-links/bulk`),
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
    return apiPath(`/workspaces/${orgId}/document-links/by-entity?${p.toString()}`)
  },

  /* --- Export --- */
  exportDocument: (
    orgId: string,
    documentId: string,
    params?: { format?: string; project_id?: string }
  ) => {
    const p = new URLSearchParams()
    if (params?.format) p.set('format', params.format)
    if (params?.project_id) p.set('project_id', params.project_id)
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/documents/${documentId}/export`) + (q ? `?${q}` : '')
  },
  exportDocuments: (orgId: string) => apiPath(`/workspaces/${orgId}/documents/export`),
  exportDocumentHub: (orgId: string) => apiPath(`/workspaces/${orgId}/document-hub/export`),
  previewDocumentHubExport: (orgId: string) =>
    apiPath(`/workspaces/${orgId}/document-hub/export/preview`),
  exportRequirementEvidence: (orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/evidence/export`),
  exportSessionEvidence: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/evidence/export`),
  exportProjectHandoff: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/documents/handoff/export`),
} as const

/**
 * Document Hub
 * Description: Cross-project document hub: list all documents across projects with rich filters,
 *              resolve deliverable selections, and fetch deliverable context.
 */
export const DOCUMENT_HUB_ENDPOINTS = {
  list: (
    _orgId: string,
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
    // BE has no org-scoped hub — documents are project-scoped.
    const projectId = params?.project_id
    if (!projectId) {
      // Placeholder never called — listDocumentHubDocuments short-circuits first.
      return apiPath('/projects/00000000-0000-0000-0000-000000000000/documents')
    }
    const p = new URLSearchParams()
    if (params?.search) p.set('q', params.search)
    if (params?.limit != null) p.set('size', String(params.limit))
    if (params?.offset != null) p.set('page', String(Math.floor(params.offset / (params.limit || 20))))
    const q = p.toString()
    return apiPath(`/projects/${projectId}/documents`) + (q ? `?${q}` : '')
  },
  deliverableContext: (orgId: string, selectedDocumentIds: string[]) => {
    const p = new URLSearchParams()
    if (selectedDocumentIds.length) p.set('selected_document_ids', selectedDocumentIds.join(','))
    const q = p.toString()
    return apiPath(`/workspaces/${orgId}/document-templates`) + (q ? `?${q}` : '')
  },
  resolveDeliverableSelection: (orgId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates`),
} as const

/**
 * Document Links (trace)
 * Description: Project-level trace links between documents and entities.
 */
export const DOCUMENT_LINKS_ENDPOINTS = {
  traceLinks: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/trace-links`),
} as const

/**
 * Document Templates
 * Description: Org-scoped document templates: list, management view, CRUD, lifecycle actions
 *              (publish, unpublish, archive, duplicate), and variable preview.
 */
export const DOCUMENT_TEMPLATE_ENDPOINTS = {
  /* --- Listing --- */
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
    return apiPath(`/workspaces/${orgId}/document-templates`) + (q ? `?${q}` : '')
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
    return apiPath(`/workspaces/${orgId}/document-templates/management`) + (q ? `?${q}` : '')
  },

  /* --- CRUD --- */
  get: (orgId: string, templateId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates/${templateId}`),
  create: (orgId: string) => apiPath(`/workspaces/${orgId}/document-templates`),
  update: (orgId: string, templateId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates/${templateId}`),

  /* --- Lifecycle --- */
  archive: (orgId: string, templateId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates/${templateId}/archive`),
  publish: (orgId: string, templateId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates/${templateId}/publish`),
  unpublish: (orgId: string, templateId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates/${templateId}/unpublish`),
  duplicate: (orgId: string, templateId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates/${templateId}/duplicate`),
  createDocument: (orgId: string) =>
    apiPath(`/workspaces/${orgId}/document-templates/create-document`),

  /* --- Variables --- */
  variables: (orgId: string) => apiPath(`/workspaces/${orgId}/document-templates/variables`),
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
      apiPath(`/workspaces/${orgId}/document-templates/${templateId}/preview-variables`) + (q ? `?${q}` : '')
    )
  },
} as const

/**
 * Project Sections
 * Description: Manage document sections within a project: create, update, archive, reorder,
 *              and initialise default sections.
 */
export const PROJECT_SECTION_ENDPOINTS = {
  list: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/sections`),
  create: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/sections`),
  update: (orgId: string, projectId: string, sectionId: string) =>
    apiPath(`/projects/${projectId}/sections/${sectionId}`),
  archive: (orgId: string, projectId: string, sectionId: string) =>
    apiPath(`/projects/${projectId}/sections/${sectionId}/archive`),
  reorder: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/sections/reorder`),
  createDefaults: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/sections/create-defaults`),
} as const
