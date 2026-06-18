/**
 * API endpoint constants — v2 API.
 * Base: NEXT_PUBLIC_API_URL (e.g. http://localhost:3000)
 */
const getBaseUrl = () =>
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
    : ''

const v2 = (path: string) => `${getBaseUrl()}/api/v2${path}`

export const AUTH_ENDPOINTS = {
  login: () => v2('/auth/login'),
  register: () => v2('/auth/register'),
  logout: () => v2('/auth/logout'),
  forgotPassword: () => v2('/auth/forgot-password'),
  google: (redirectTo?: string) => {
    const url = v2('/auth/google')
    if (redirectTo) return `${url}?redirectTo=${encodeURIComponent(redirectTo)}`
    return url
  },
  me: () => v2('/auth/me'),
  updateMe: () => v2('/auth/me'),
} as const

export const PROFILE_ENDPOINTS = {
  getProfile: () => v2('/profile'),
  updateProfile: () => v2('/profile'),
  uploadAvatar: () => v2('/profile/avatar'),
} as const

export const ORG_ENDPOINTS = {
  list: (params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2('/orgs') + (q ? `?${q}` : '')
  },
  create: () => v2('/orgs'),
  get: (orgId: string) => v2(`/orgs/${orgId}`),
  setDefault: (orgId: string) => v2(`/orgs/${orgId}/default`),
  members: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/members`) + (q ? `?${q}` : '')
  },
  member: (orgId: string, userId: string) => v2(`/orgs/${orgId}/members/${userId}`),
  leave: (orgId: string) => v2(`/orgs/${orgId}/leave`),
  invites: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/invites`) + (q ? `?${q}` : '')
  },
  createInvite: (orgId: string) => v2(`/orgs/${orgId}/invites`),
  revokeInvite: (orgId: string, inviteId: string) => v2(`/orgs/${orgId}/invites/${inviteId}/revoke`),
} as const

/** Org Actors (Traceability) */
export const ACTORS_ENDPOINTS = {
  list: (orgId: string, params?: { limit?: number; offset?: number; active_only?: boolean }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    if (params?.active_only != null) p.set('active_only', String(params.active_only))
    const q = p.toString()
    return v2(`/orgs/${orgId}/actors`) + (q ? `?${q}` : '')
  },
  create: (orgId: string) => v2(`/orgs/${orgId}/actors`),
  get: (orgId: string, actorId: string) => v2(`/orgs/${orgId}/actors/${actorId}`),
  patch: (orgId: string, actorId: string) => v2(`/orgs/${orgId}/actors/${actorId}`),
} as const

export const ORG_INVITE_ENDPOINTS = {
  accept: () => v2('/org-invites/accept'),
} as const

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

export const PROJECT_ENDPOINTS = {
  list: (orgId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects`) + (q ? `?${q}` : '')
  },
  create: (orgId: string) => v2(`/orgs/${orgId}/projects`),
  get: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}`),
  questions: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}/questions`),
  question: (orgId: string, projectId: string, questionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/questions/${questionId}`),
  questionsReorder: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/questions/reorder`),
  members: (orgId: string, projectId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects/${projectId}/members`) + (q ? `?${q}` : '')
  },
  projectMember: (orgId: string, projectId: string, userId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/members/${userId}`),
  scope: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/scope`),
  trace: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/trace`),
  requirements: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements`),
  requirement: (orgId: string, projectId: string, requirementId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}`),
  requirementActors: (orgId: string, projectId: string, requirementId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}/actors`),
  requirementModules: (orgId: string, projectId: string, requirementId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/requirements/${requirementId}/modules`),
  traceLinks: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/trace-links`),
  traceLink: (orgId: string, projectId: string, linkId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/trace-links/${linkId}`),
} as const

export const SESSION_ENDPOINTS = {
  list: (orgId: string, projectId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/projects/${projectId}/sessions`) + (q ? `?${q}` : '')
  },
  create: (orgId: string, projectId: string) => v2(`/orgs/${orgId}/projects/${projectId}/sessions`),
  get: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}`),
  putAnswers: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/answers`),
  submit: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/submit`),
  lock: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/lock`),
  reopen: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/reopen`),
  progress: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/progress`),
  fromRevision: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/from-revision`),
} as const

export const ADMIN_ENDPOINTS = {
  templates: () => v2('/admin/templates'),
  template: (templateId: string) => v2(`/admin/templates/${templateId}`),
  templateQuestions: (templateId: string) => v2(`/admin/templates/${templateId}/questions`),
  templatePublish: (templateId: string) => v2(`/admin/templates/${templateId}/publish`),
  templateDuplicate: (templateId: string) => v2(`/admin/templates/${templateId}/duplicate`),
  question: (questionId: string) => v2(`/admin/questions/${questionId}`),
} as const

export const AI_ENDPOINTS = {
  improve: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/improve`),
  improveCommit: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/improve/commit`),
  questionsGenerate: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/questions/generate`),
  questionsCommit: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/questions/commit`),
  intakesUploadUrl: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/intakes/upload-url`),
  intakes: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/intakes`),
  impactAnalysis: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/impact-analysis`),
  impactAnalysisCommit: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai/impact-analysis/commit`),
  claritySummary: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/clarity/summary`),
  clarityAssessOne: (orgId: string, projectId: string, sessionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sessions/${sessionId}/ai/clarity/assess-one`),
} as const

export const DOCUMENT_ENDPOINTS = {
  listOrg: (orgId: string, params?: { q?: string; exclude_project_id?: string; limit?: number; offset?: number }) => {
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
    params?: { q?: string; document_type?: string; pinned_only?: boolean; status?: string; workflow_status?: string; limit?: number; offset?: number }
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
    return v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/templates`) + (q ? `?${q}` : '')
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
    return v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/picker`) + (q ? `?${q}` : '')
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
    return v2(`/orgs/${orgId}/projects/${projectId}/documents/deliverables/history`) + (q ? `?${q}` : '')
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
  exportDocument: (orgId: string, documentId: string, params?: { format?: string; project_id?: string }) => {
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

export const PROJECT_SECTION_ENDPOINTS = {
  list: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections`),
  create: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections`),
  update: (orgId: string, projectId: string, sectionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/${sectionId}`),
  archive: (orgId: string, projectId: string, sectionId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/${sectionId}/archive`),
  reorder: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/reorder`),
  createDefaults: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/sections/create-defaults`),
} as const

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

/** Traceability: Org Landscape (nodes, node-links) */
export const LANDSCAPE_ENDPOINTS = {
  nodes: (orgId: string, params?: { type?: string; status?: string }) => {
    const p = new URLSearchParams()
    if (params?.type) p.set('type', params.type)
    if (params?.status) p.set('status', params.status)
    const q = p.toString()
    return v2(`/orgs/${orgId}/nodes`) + (q ? `?${q}` : '')
  },
  node: (orgId: string, nodeId: string) => v2(`/orgs/${orgId}/nodes/${nodeId}`),
  nodePositions: (orgId: string) => v2(`/orgs/${orgId}/nodes/positions`),
  nodeLinks: (orgId: string) => v2(`/orgs/${orgId}/node-links`),
  nodeLink: (orgId: string, linkId: string) => v2(`/orgs/${orgId}/node-links/${linkId}`),
} as const

/** Document collaboration */
export const COLLABORATION_ENDPOINTS = {
  comments: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; include_resolved?: boolean }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.include_resolved != null) p.set('include_resolved', String(params.include_resolved))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments`) + (q ? `?${q}` : '')
  },
  comment: (orgId: string, documentId: string, commentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments/${commentId}`),
  resolveComment: (orgId: string, documentId: string, commentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments/${commentId}/resolve`),
  reopenComment: (orgId: string, documentId: string, commentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/comments/${commentId}/reopen`),
  suggestions: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; include_closed?: boolean }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.include_closed != null) p.set('include_closed', String(params.include_closed))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/collaboration/suggestions`) + (q ? `?${q}` : '')
  },
  acceptSuggestion: (orgId: string, documentId: string, suggestionId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/suggestions/${suggestionId}/accept`),
  rejectSuggestion: (orgId: string, documentId: string, suggestionId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/suggestions/${suggestionId}/reject`),
  activity: (
    orgId: string,
    documentId: string,
    params?: { project_id?: string; limit?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.limit != null) p.set('limit', String(params.limit))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/collaboration/activity`) + (q ? `?${q}` : '')
  },
  collaborators: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/collaborators`),
  collaborator: (orgId: string, documentId: string, userId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/collaborators/${userId}`),
  share: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/collaboration/share`),
  mentionableUsers: (orgId: string, params?: { project_id?: string; q?: string }) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.q) p.set('q', params.q)
    const q = p.toString()
    return v2(`/orgs/${orgId}/mentionable-users`) + (q ? `?${q}` : '')
  },
} as const

export const AI_DOCUMENT_ENDPOINTS = {
  projectBrief: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/project-brief`),
  summarizeDocuments: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/summarize-documents`),
  qaSummary: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/qa-summary`),
  clarityReport: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/clarity-report`),
  readinessReport: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/readiness-report`),
  fromTemplate: (orgId: string, projectId: string) =>
    v2(`/orgs/${orgId}/projects/${projectId}/ai-documents/from-template`),
  summarizeDocument: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/ai/summarize`),
  relatedDocuments: (orgId: string, documentId: string, params?: { project_id?: string; limit?: number }) => {
    const p = new URLSearchParams()
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.limit != null) p.set('limit', String(params.limit))
    const q = p.toString()
    return v2(`/orgs/${orgId}/documents/${documentId}/ai/related`) + (q ? `?${q}` : '')
  },
  documentMetadata: (orgId: string, documentId: string) =>
    v2(`/orgs/${orgId}/documents/${documentId}/ai/metadata`),
  savePreview: (orgId: string) => v2(`/orgs/${orgId}/ai-documents/save-preview`),
} as const

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

export const AUDIT_ENDPOINTS = {
  list: () => v2('/audit-events'),
} as const

export const CHANGE_REQUEST_ENDPOINTS = {
  listInDocument: (documentId: string) => v2(`/documents/${documentId}/change-requests`),
  createInDocument: (documentId: string) => v2(`/documents/${documentId}/change-requests`),
  detail: (id: string) => v2(`/change-requests/${id}`),
  updateStatus: (id: string) => v2(`/change-requests/${id}/status`),
  addImpact: (id: string) => v2(`/change-requests/${id}/impacts`),
  listImpacts: (id: string) => v2(`/change-requests/${id}/impacts`),
  removeImpact: (impactId: string) => v2(`/change-request-impacts/${impactId}`),
  aiRun: (id: string) => v2(`/change-requests/${id}/ai-run`),
  listAiRuns: (id: string) => v2(`/change-requests/${id}/ai-runs`),
  apply: (id: string) => v2(`/change-requests/${id}/apply`),
} as const

export const CONTROLLED_LIST_ENDPOINTS = {
  listInProject: (projectId: string) => v2(`/projects/${projectId}/controlled-lists`),
  createInProject: (projectId: string) => v2(`/projects/${projectId}/controlled-lists`),
  get: (listId: string) => v2(`/controlled-lists/${listId}`),
  updateInProject: (projectId: string, listId: string) => v2(`/projects/${projectId}/controlled-lists/${listId}`),
  removeInProject: (projectId: string, listId: string) => v2(`/projects/${projectId}/controlled-lists/${listId}`),
} as const

export const CONTROLLED_VALUE_ENDPOINTS = {
  createInList: (listId: string) => v2(`/controlled-lists/${listId}/values`),
  update: (valueId: string) => v2(`/controlled-values/${valueId}`),
  remove: (valueId: string) => v2(`/controlled-values/${valueId}`),
} as const

export const ATTACHMENT_ENDPOINTS = {
  signedUpload: () => v2('/attachments/signed-upload'),
  signedDownload: (attachmentId: string) => v2(`/attachments/${attachmentId}/signed-download`),
  itemAttachments: (itemId: string) => v2(`/items/${itemId}/attachments`),
  itemAttachmentsList: (itemId: string) => v2(`/items/${itemId}/attachments`),
  sectionAttachments: (sectionId: string) => v2(`/sections/${sectionId}/attachments`),
  sectionAttachmentsList: (sectionId: string) => v2(`/sections/${sectionId}/attachments`),
} as const
