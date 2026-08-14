/** Workspace-scoped route path helpers. URL segment is workspaceId. */
export const WORKSPACE_ROUTES = {
  root: (workspaceId: string) => `/workspace/${workspaceId}`,
  overview: (workspaceId: string) => `/workspace/${workspaceId}`,
  projects: (workspaceId: string) => `/workspace/${workspaceId}/projects`,
  members: (workspaceId: string) => `/workspace/${workspaceId}/members`,
  invitations: (workspaceId: string) => `/workspace/${workspaceId}/invitations`,
  joinRequests: (workspaceId: string) => `/workspace/${workspaceId}/join-requests`,
  teams: (workspaceId: string) => `/workspace/${workspaceId}/teams`,
  team: (workspaceId: string, teamId: string) => `/workspace/${workspaceId}/teams/${teamId}`,
  /** P1: Directory consolidates Members / Teams / Invitations / Join requests. */
  directory: (workspaceId: string, tab?: 'members' | 'teams' | 'invitations' | 'join-requests') => {
    const base = `/workspace/${workspaceId}/directory`
    return tab && tab !== 'members' ? `${base}?tab=${tab}` : base
  },
  activity: (workspaceId: string) => `/workspace/${workspaceId}/activity`,
  dailyRecord: (workspaceId: string) => `/workspace/${workspaceId}/daily-record`,
  teamPulse: (workspaceId: string) => `/workspace/${workspaceId}/team-pulse`,
  /** Organization directory consolidates Org members / invitations / teams. */
  organizationDirectory: (workspaceId: string, tab?: 'members' | 'invitations' | 'teams') => {
    const base = `/workspace/${workspaceId}/organization/directory`
    return tab && tab !== 'members' ? `${base}?tab=${tab}` : base
  },
  /** @deprecated Prefer organizationDirectory(..., 'members'). */
  organizationMembers: (workspaceId: string) =>
    `/workspace/${workspaceId}/organization/directory?tab=members`,
  /** @deprecated Prefer organizationDirectory(..., 'invitations'). */
  organizationInvitations: (workspaceId: string) =>
    `/workspace/${workspaceId}/organization/directory?tab=invitations`,
  /** Wave 2: project entry lands on Overview. */
  project: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/overview`,
  projectOverview: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/overview`,
  projectWork: (workspaceId: string, projectId: string, view?: 'list' | 'board' | 'chart') => {
    const base = `/workspace/${workspaceId}/projects/${projectId}/work`
    return view && view !== 'list' ? `${base}?view=${view}` : base
  },
  projectWorkTask: (
    workspaceId: string,
    projectId: string,
    taskId: string,
    view?: 'list' | 'board' | 'chart'
  ) => {
    const params = new URLSearchParams()
    if (view && view !== 'list') params.set('view', view)
    params.set('task', taskId)
    return `/workspace/${workspaceId}/projects/${projectId}/work?${params.toString()}`
  },
  /** Wave 2 P2: Plan Structure (planning elements tree). URL keeps /wbs for BE compatibility. */
  projectWbs: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/wbs`,
  /** Wave 2 P2: Gantt timeline (read-only). */
  projectTimeline: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/timeline`,
  /** @deprecated Alias for projectTimeline. */
  projectGantt: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/timeline`,
  /** Wave 2 P2: Schedule runs + current schedule tasks. */
  projectSchedule: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/schedule`,
  /** Wave 3 P2a: Project resource plan + effort. */
  projectResources: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/resources`,
  projectResourcesEffort: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/resources/effort`,
  /** Wave 3 P2b: Estimation center + run detail. */
  projectEstimation: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/estimation`,
  projectEstimationRun: (workspaceId: string, projectId: string, estimationRunId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/estimation/${estimationRunId}`,
  /** Wave 3 P3: Finance scenarios + workbench + compare. */
  projectFinancials: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/financials`,
  projectFinancialsScenario: (workspaceId: string, projectId: string, scenarioId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/financials/${scenarioId}`,
  projectFinancialsCompare: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/financials/compare`,
  /** Wave 3 P4: Profitability center. */
  projectProfitability: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/profitability`,
  /** Wave 3 P5: Quotes register + builder. */
  projectQuotes: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quotes`,
  projectQuote: (workspaceId: string, projectId: string, quoteId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quotes/${quoteId}`,
  /** Wave 3 P6: Baselines + change requests. */
  projectBaselines: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/baselines`,
  projectBaseline: (workspaceId: string, projectId: string, baselineId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/baselines/${baselineId}`,
  projectChangeRequests: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/change-requests`,
  projectChangeRequest: (workspaceId: string, projectId: string, changeRequestId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/change-requests/${changeRequestId}`,
  projectMembers: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/members`,
  projectSettings: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/settings`,
  projectQuestions: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/questions`,
  /** Elicitation: AI-assisted requirements clarification sessions. */
  projectElicitation: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/elicitation`,
  /** Wave 2 P3: Scope register (packages + items). */
  projectScope: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/scope`,
  /** Wave 2 P3: Deliverables + acceptance criteria. */
  projectDeliverables: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/deliverables`,
  /** Wave 2 P3: RAID register (Risks, Assumptions, Issues, Dependencies). */
  projectRaid: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/raid`,
  /** Wave 2 P3: Decision log. */
  projectDecisions: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/decisions`,
  /** Wave 2 P3: Scope/RAID reports. */
  projectReports: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/reports`,
  projectDocuments: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/documents`,
  document: (workspaceId: string, documentId: string, projectId?: string) => {
    const base = `/workspace/${workspaceId}/documents/${documentId}`
    if (projectId) return `${base}?projectId=${encodeURIComponent(projectId)}`
    return base
  },
  sessions: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/sessions`,
  session: (workspaceId: string, projectId: string, sessionId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/sessions/${sessionId}`,
  projectMeetings: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/meetings`,
  projectMeeting: (workspaceId: string, projectId: string, meetingId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/meetings/${meetingId}`,
  /** Phase 03 workspace settings (name, visibility, join policy). */
  settingsGeneral: (workspaceId: string) => `/workspace/${workspaceId}/settings/general`,
  settingsMemberPermissions: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/member-permissions`,
  organizationMemberPermissions: (workspaceId: string) =>
    `/workspace/${workspaceId}/organization/member-permissions`,
  projectMemberPermissions: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/settings/member-permissions`,
  /**
   * @deprecated Prefer settingsGeneral for workspace settings, or settingsControlledLists
   * for controlled lists. Kept pointing at general for AppShell “Workspace settings”.
   */
  settings: (workspaceId: string) => `/workspace/${workspaceId}/settings/general`,
  settingsTemplates: (workspaceId: string) => `/workspace/${workspaceId}/settings/templates`,
  settingsTemplateNew: (workspaceId: string) => `/workspace/${workspaceId}/settings/templates/new`,
  settingsTemplate: (workspaceId: string, templateId: string) =>
    `/workspace/${workspaceId}/settings/templates/${templateId}`,
  documentHub: (workspaceId: string, opts?: { projectId?: string }) => {
    const base = `/workspace/${workspaceId}/document-hub`
    if (opts?.projectId) {
      return `${base}?projectId=${encodeURIComponent(opts.projectId)}`
    }
    return base
  },
  settingsControlledLists: (workspaceId: string, projectId?: string | null) =>
    `/workspace/${workspaceId}/settings/controlled-lists${projectId ? `?project=${projectId}` : ''}`,
  settingsControlledListDetail: (workspaceId: string, listId: string, projectId?: string | null) =>
    `/workspace/${workspaceId}/settings/controlled-lists/${listId}${projectId ? `?project=${projectId}` : ''}`,
  clients: (workspaceId: string) => `/workspace/${workspaceId}/clients`,
  forms: (workspaceId: string) => `/workspace/${workspaceId}/forms`,
  form: (workspaceId: string, formId: string) => `/workspace/${workspaceId}/forms/${formId}`,
  submissions: (workspaceId: string) => `/workspace/${workspaceId}/submissions`,
  ratesLookup: (workspaceId: string) => `/workspace/${workspaceId}/rates/lookup`,
  /** Wave 3: Workspace capacity hub (operations). */
  capacity: (workspaceId: string) => `/workspace/${workspaceId}/capacity`,
  capacityResources: (workspaceId: string) => `/workspace/${workspaceId}/capacity/resources`,
  capacityAllocations: (workspaceId: string) => `/workspace/${workspaceId}/capacity/allocations`,
  /** Wave 4: Cross-project team schedule (resource timeline). */
  resourceTimeline: (workspaceId: string) => `/workspace/${workspaceId}/resource-timeline`,
  /** Wave 3 P1a: Capacity setup (settings). */
  settingsCapacity: (workspaceId: string) => `/workspace/${workspaceId}/settings/capacity`,
  settingsCapacityCalendars: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/capacity/calendars`,
  settingsCapacityCalendar: (workspaceId: string, calendarId: string) =>
    `/workspace/${workspaceId}/settings/capacity/calendars/${calendarId}`,
  settingsCapacityResources: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/capacity/resources`,
  settingsCapacityProfiles: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/capacity/profiles`,
  settingsCapacityPolicies: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/capacity/policies`,
  /** Wave 3 P4: Billing / profit rate cards (≠ Cost Rate Cards). */
  settingsBillingRateCards: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/commercial/rate-cards`,
  governance: (workspaceId: string) => `/workspace/${workspaceId}/governance`,
  governancePolicy: (workspaceId: string, policyId: string) =>
    `/workspace/${workspaceId}/governance/${policyId}`,
  agentControl: (workspaceId: string) => `/workspace/${workspaceId}/agent-control`,
  notifications: (workspaceId: string) => `/workspace/${workspaceId}/notifications`,
  notificationSettings: (workspaceId: string) => `/workspace/${workspaceId}/notifications/settings`,

  // ── Wave 4 ─────────────────────────────────────────────────
  search: (workspaceId: string) => `/workspace/${workspaceId}/search`,
  workInbox: (workspaceId: string) => `/workspace/${workspaceId}/work-inbox`,
  myInsights: (workspaceId: string) => `/workspace/${workspaceId}/my-insights`,
  myWork: (workspaceId: string) => `/workspace/${workspaceId}/my-work`,
  savedItems: (workspaceId: string) => `/workspace/${workspaceId}/saved-items`,
  applications: (workspaceId: string) => `/workspace/${workspaceId}/applications`,
  /** Application workbench detail. */
  application: (workspaceId: string, applicationId: string) =>
    `/workspace/${workspaceId}/applications/${applicationId}`,
  /** Alias — prefer this if `application` is shadowed by a stale bundle. */
  applicationDetail: (workspaceId: string, applicationId: string) =>
    `/workspace/${workspaceId}/applications/${applicationId}`,
  support: (workspaceId: string) => `/workspace/${workspaceId}/support`,
  supportCase: (workspaceId: string, caseId: string) =>
    `/workspace/${workspaceId}/support/cases/${caseId}`,
  projectQuality: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quality`,
  projectQualityCases: (
    workspaceId: string,
    projectId: string,
    opts?: { type?: 'functional' | 'nfr'; selected?: string }
  ) => {
    const base = `/workspace/${workspaceId}/projects/${projectId}/quality/cases`
    const params = new URLSearchParams()
    if (opts?.type) params.set('type', opts.type)
    if (opts?.selected) params.set('selected', opts.selected)
    const q = params.toString()
    return q ? `${base}?${q}` : base
  },
  projectQualityRuns: (
    workspaceId: string,
    projectId: string,
    opts?: { runId?: string }
  ) => {
    const base = `/workspace/${workspaceId}/projects/${projectId}/quality/runs`
    return opts?.runId ? `${base}?runId=${encodeURIComponent(opts.runId)}` : base
  },
  projectQualityDefects: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quality/defects`,
  projectQualityReleases: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quality/releases`,
  projectTestPlans: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quality/test-plans`,
  projectTestCases: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quality/test-cases`,
  projectTestCaseLinks: (workspaceId: string, projectId: string, useCaseId?: string) => {
    const base = `/workspace/${workspaceId}/projects/${projectId}/quality/test-cases/links`
    if (useCaseId) return `${base}?useCaseId=${encodeURIComponent(useCaseId)}`
    return base
  },
  projectQualityCaseLinks: (workspaceId: string, projectId: string, useCaseId?: string) => {
    const base = `/workspace/${workspaceId}/projects/${projectId}/quality/cases/links`
    if (useCaseId) return `${base}?useCaseId=${encodeURIComponent(useCaseId)}`
    return base
  },
  projectVerificationCases: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quality/verification-cases`,
  projectTestRuns: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/quality/test-runs`,
  projectDefects: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/defects`,
  projectReleases: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/releases`,
  projectDeployments: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/deployments`,
  projectRequirements: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/requirements`,
  projectFunctionalCatalog: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/functional-catalog`,
  projectUseCases: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/use-cases`,
  projectApplicationStructure: (workspaceId: string, projectId: string, applicationId?: string) => {
    const base = `/workspace/${workspaceId}/projects/${projectId}/application-structure`
    if (applicationId) {
      return `${base}?applicationId=${encodeURIComponent(applicationId)}`
    }
    return base
  },
  projectTraceability: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/traceability`,
  projectGovernance: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/governance`,
  projectAiPlanning: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/ai-planning`,
  projectRecommendations: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/recommendations`,
  projectNotificationSettings: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/settings/notifications`,
  projectDocumentEdit: (workspaceId: string, projectId: string, documentId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/documents/${documentId}/edit`,
  projectClientCollaboration: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/client-collaboration`,
  projectDashboard: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/dashboard`,
  projectReportLibrary: (workspaceId: string, projectId: string) =>
    `/workspace/${workspaceId}/projects/${projectId}/report-library`,
  settingsKnowledge: (workspaceId: string) => `/workspace/${workspaceId}/settings/knowledge`,
  settingsDocumentTemplates: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/knowledge/templates`,
  settingsKnowledgeIndexing: (workspaceId: string) =>
    `/workspace/${workspaceId}/settings/knowledge/indexing`,
  settingsIntegrations: (workspaceId: string) => `/workspace/${workspaceId}/settings/integrations`,
  settingsTrust: (workspaceId: string) => `/workspace/${workspaceId}/settings/trust`,
  settingsSupport: (workspaceId: string) => `/workspace/${workspaceId}/settings/support`,
  aiAssistant: (workspaceId: string) => `/workspace/${workspaceId}/ai`,
  aiAssistantConversation: (workspaceId: string, conversationId: string) =>
    `/workspace/${workspaceId}/ai/c/${conversationId}`,
  aiAssistantAsk: (
    workspaceId: string,
    opts: { projectId: string; documentId: string; documentTitle?: string }
  ) => {
    const q = new URLSearchParams({
      projectId: opts.projectId,
      documentId: opts.documentId,
    })
    if (opts.documentTitle) q.set('documentTitle', opts.documentTitle)
    return `/workspace/${workspaceId}/ai?${q.toString()}`
  },
} as const

/** @deprecated Use WORKSPACE_ROUTES — legacy alias kept for incremental migration. */
export const ORG_ROUTES = WORKSPACE_ROUTES
