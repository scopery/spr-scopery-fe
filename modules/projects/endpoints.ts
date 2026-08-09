import { apiPath } from '@/shared/lib/api-paths'

/**
 * Projects
 * Description: Manage project lifecycle: create, list, and retrieve projects.
 *              Includes sub-resources: questions, members, scope, requirements, and trace-links.
 */
export const PROJECT_ENDPOINTS = {
  /* --- Core CRUD (v1: /api/projects) --- */
  list: (
    workspaceId: string,
    params?: { keyword?: string; status?: string; page?: number; size?: number }
  ) => {
    const p = new URLSearchParams()
    p.set('workspaceId', workspaceId)
    if (params?.keyword) p.set('keyword', params.keyword)
    if (params?.status) p.set('status', params.status)
    if (params?.page != null) p.set('page', String(params.page))
    if (params?.size != null) p.set('size', String(params.size))
    return apiPath('/projects') + `?${p.toString()}`
  },
  create: () => apiPath('/projects'),
  get: (projectId: string) => apiPath(`/projects/${projectId}`),
  update: (projectId: string) => apiPath(`/projects/${projectId}`),
  activate: (projectId: string) => apiPath(`/projects/${projectId}/activate`),
  hold: (projectId: string) => apiPath(`/projects/${projectId}/hold`),
  complete: (projectId: string) => apiPath(`/projects/${projectId}/complete`),
  archive: (projectId: string) => apiPath(`/projects/${projectId}/archive`),

  /* --- Phases (Wave 2) --- */
  phases: {
    list: (
      projectId: string,
      params?: { status?: string; page?: number; size?: number }
    ) => {
      const p = new URLSearchParams()
      if (params?.status) p.set('status', params.status)
      if (params?.page != null) p.set('page', String(params.page))
      if (params?.size != null) p.set('size', String(params.size))
      const q = p.toString()
      return apiPath(`/projects/${projectId}/phases`) + (q ? `?${q}` : '')
    },
    get: (projectId: string, phaseId: string) =>
      apiPath(`/projects/${projectId}/phases/${phaseId}`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/phases`),
    bulk: (projectId: string) => apiPath(`/projects/${projectId}/phases/bulk`),
    update: (projectId: string, phaseId: string) =>
      apiPath(`/projects/${projectId}/phases/${phaseId}`),
    activate: (projectId: string, phaseId: string) =>
      apiPath(`/projects/${projectId}/phases/${phaseId}/activate`),
    complete: (projectId: string, phaseId: string) =>
      apiPath(`/projects/${projectId}/phases/${phaseId}/complete`),
    archive: (projectId: string, phaseId: string) =>
      apiPath(`/projects/${projectId}/phases/${phaseId}/archive`),
    createFromDefinition: (projectId: string) =>
      apiPath(`/projects/${projectId}/phases/from-definition`),
  },

  /* --- Tasks (Wave 2) --- */
  tasks: {
    list: (
      projectId: string,
      params?: {
        projectPhaseId?: string
        wbsNodeId?: string
        /** Single status only — BE rejects comma-joined / multi status. */
        status?: string
        priority?: string
        keyword?: string
        page?: number
        size?: number
      }
    ) => {
      const p = new URLSearchParams()
      if (params?.projectPhaseId) p.set('projectPhaseId', params.projectPhaseId)
      if (params?.wbsNodeId) p.set('wbsNodeId', params.wbsNodeId)
      // Never pass arrays — URLSearchParams stringifies them as "A,B,C" and BE rejects.
      if (typeof params?.status === 'string' && params.status) p.set('status', params.status)
      if (params?.priority) p.set('priority', params.priority)
      if (params?.keyword) p.set('keyword', params.keyword)
      if (params?.page != null) p.set('page', String(params.page))
      if (params?.size != null) p.set('size', String(params.size))
      const q = p.toString()
      return apiPath(`/projects/${projectId}/tasks`) + (q ? `?${q}` : '')
    },
    get: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}`),
    create: (projectId: string) => apiPath(`/projects/${projectId}/tasks`),
    bulk: (projectId: string) => apiPath(`/projects/${projectId}/tasks/bulk`),
    update: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}`),
    start: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/start`),
    block: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/block`),
    complete: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/complete`),
    cancel: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/cancel`),
    archive: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/archive`),
    reopen: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}/reopen`),
    delete: (projectId: string, taskId: string) =>
      apiPath(`/projects/${projectId}/tasks/${taskId}`),
    roleContributions: {
      list: (projectId: string, taskId: string) =>
        apiPath(`/projects/${projectId}/tasks/${taskId}/role-contributions`),
      create: (projectId: string, taskId: string) =>
        apiPath(`/projects/${projectId}/tasks/${taskId}/role-contributions`),
      delete: (projectId: string, taskId: string, id: string) =>
        apiPath(`/projects/${projectId}/tasks/${taskId}/role-contributions/${id}`),
    },
  },

  /* --- Questions (legacy v2 paths — not yet migrated) --- */
  questions: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/questions`),
  question: (orgId: string, projectId: string, questionId: string) =>
    apiPath(`/projects/${projectId}/questions/${questionId}`),
  questionsReorder: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/questions/reorder`),

  /* --- Members --- */
  members: (orgId: string, projectId: string, params?: { limit?: number; offset?: number }) => {
    const p = new URLSearchParams()
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath(`/projects/${projectId}/members`) + (q ? `?${q}` : '')
  },
  projectMember: (orgId: string, projectId: string, userId: string) =>
    apiPath(`/projects/${projectId}/members/${userId}`),

  /* --- Scope & Trace --- */
  scope: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/scope-packages`),
  trace: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/trace-links`),

  /* --- Requirements --- */
  requirements: (
    orgId: string,
    projectId: string,
    params?: { includeArchived?: boolean; limit?: number; offset?: number }
  ) => {
    const search = new URLSearchParams()
    if (params?.includeArchived) search.set('includeArchived', 'true')
    if (params?.limit != null) search.set('limit', String(params.limit))
    if (params?.offset != null) search.set('offset', String(params.offset))
    const q = search.toString()
    return apiPath(`/projects/${projectId}/requirements`) + (q ? `?${q}` : '')
  },
  requirementsBulk: (_orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/requirements/bulk`),
  requirement: (orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}`),
  requirementArchive: (_orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/archive`),
  requirementApprove: (_orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/approve`),
  requirementReject: (_orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/reject`),
  requirementDefer: (_orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/defer`),
  requirementImplement: (_orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/implement`),
  requirementActors: (orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/actors`),
  requirementModules: (orgId: string, projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/modules`),

  /* --- Trace links --- */
  traceLinks: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/trace-links`),
  traceLink: (orgId: string, projectId: string, linkId: string) =>
    apiPath(`/projects/${projectId}/trace-links/${linkId}`),
} as const

/**
 * AI
 * Description: Project-level AI features: generate and commit questions, run improve flows,
 *              upload intakes, analyse impact, and assess clarity on session answers.
 */
export const AI_ENDPOINTS = {
  /* --- Improve --- */
  improve: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/ai/improve`),
  improveCommit: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/ai/improve/commit`),

  /* --- Questions generation --- */
  questionsGenerate: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/ai/questions/generate`),
  questionsCommit: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/ai/questions/commit`),

  /* --- Intakes --- */
  intakesUploadUrl: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/ai/intakes/upload-url`),
  intakes: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/ai/intakes`),

  /* --- Impact analysis --- */
  impactAnalysis: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/ai/impact-analysis`),
  impactAnalysisCommit: (orgId: string, projectId: string) =>
    apiPath(`/projects/${projectId}/ai/impact-analysis/commit`),

  /* --- Clarity --- */
  claritySummary: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/ai/clarity/summary`),
  clarityAssessOne: (orgId: string, projectId: string, sessionId: string) =>
    apiPath(`/projects/${projectId}/sessions/${sessionId}/ai/clarity/assess-one`),
} as const
