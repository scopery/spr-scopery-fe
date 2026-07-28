import { NavCapabilityKey } from '../model/nav-capabilities'
import { ROUTES } from '@/constants/routes'

export interface NavRouteRequirement {
  /** Capability that must be true to stay on this path. */
  key: string
  /** Where to send the user when denied. */
  fallbackHref: string
}

/**
 * Maps a workspace-scoped pathname to the nav capability required to view it.
 * Returns null when the route is ungated (or unknown / personal).
 */
export function resolveNavCapabilityForPath(
  pathname: string | null,
  workspaceId: string
): NavRouteRequirement | null {
  if (!pathname) return null
  const ws = `/workspace/${workspaceId}`
  if (!pathname.startsWith(ws)) return null

  const rest = pathname.slice(ws.length) // '' | '/…'
  const projectMatch = rest.match(/^\/projects\/([^/]+)(\/.*)?$/)
  if (projectMatch) {
    const projectId = projectMatch[1]!
    const projectRest = projectMatch[2] ?? ''
    const projectHome = ROUTES.workspace.projectOverview(workspaceId, projectId)
    const wsHome = ROUTES.workspace.projects(workspaceId)

    const projectRules: Array<{ prefix: string; key: string }> = [
      { prefix: '/financials', key: NavCapabilityKey.ProjectFinancials },
      { prefix: '/estimation', key: NavCapabilityKey.ProjectEstimation },
      { prefix: '/profitability', key: NavCapabilityKey.ProjectProfitability },
      { prefix: '/quotes', key: NavCapabilityKey.ProjectQuotes },
      { prefix: '/baselines', key: NavCapabilityKey.ProjectBaselines },
      { prefix: '/change-requests', key: NavCapabilityKey.ProjectChangeRequests },
      { prefix: '/quality', key: NavCapabilityKey.ProjectQuality },
      { prefix: '/test-plans', key: NavCapabilityKey.ProjectTestPlans },
      { prefix: '/defects', key: NavCapabilityKey.ProjectDefects },
      { prefix: '/releases', key: NavCapabilityKey.ProjectReleases },
      { prefix: '/resources', key: NavCapabilityKey.ProjectResources },
      { prefix: '/ai-planning', key: NavCapabilityKey.ProjectAiPlanning },
      { prefix: '/recommendations', key: NavCapabilityKey.ProjectRecommendations },
      { prefix: '/client-collaboration', key: NavCapabilityKey.ProjectClientCollaboration },
      { prefix: '/governance', key: NavCapabilityKey.ProjectGovernance },
      { prefix: '/dashboard', key: NavCapabilityKey.ProjectDashboard },
      { prefix: '/reports', key: NavCapabilityKey.ProjectReports },
      { prefix: '/scope', key: NavCapabilityKey.ProjectScope },
      { prefix: '/deliverables', key: NavCapabilityKey.ProjectDeliverables },
      { prefix: '/requirements', key: NavCapabilityKey.ProjectRequirements },
      { prefix: '/functional-catalog', key: NavCapabilityKey.ProjectFunctionalCatalog },
      { prefix: '/application-structure', key: NavCapabilityKey.ProjectApplicationStructure },
      { prefix: '/traceability', key: NavCapabilityKey.ProjectTraceability },
      { prefix: '/raid', key: NavCapabilityKey.ProjectRaid },
      { prefix: '/decisions', key: NavCapabilityKey.ProjectDecisions },
      { prefix: '/meetings', key: NavCapabilityKey.ProjectMeetings },
      { prefix: '/work', key: NavCapabilityKey.ProjectWork },
      { prefix: '/wbs', key: NavCapabilityKey.ProjectWbs },
      { prefix: '/timeline', key: NavCapabilityKey.ProjectTimeline },
      { prefix: '/schedule', key: NavCapabilityKey.ProjectSchedule },
      { prefix: '/members', key: NavCapabilityKey.ProjectDirectoryMembers },
      { prefix: '/settings', key: NavCapabilityKey.SettingsProjectEntry },
      { prefix: '/overview', key: NavCapabilityKey.ProjectOverview },
    ]

    for (const rule of projectRules) {
      if (projectRest === rule.prefix || projectRest.startsWith(rule.prefix + '/')) {
        return {
          key: rule.key,
          fallbackHref:
            rule.key === NavCapabilityKey.ProjectOverview ? wsHome : projectHome,
        }
      }
    }

    // Bare /projects/{id} → overview
    if (!projectRest || projectRest === '/') {
      return { key: NavCapabilityKey.ProjectOverview, fallbackHref: wsHome }
    }

    return null
  }

  const wsHome = ROUTES.workspace.projects(workspaceId)

  const workspaceRules: Array<{ prefix: string; key: string }> = [
    { prefix: '/capacity', key: NavCapabilityKey.WorkspaceCapacity },
    { prefix: '/clients', key: NavCapabilityKey.WorkspaceClients },
    { prefix: '/applications', key: NavCapabilityKey.WorkspaceApplications },
    { prefix: '/support', key: NavCapabilityKey.WorkspaceSupport },
    { prefix: '/forms', key: NavCapabilityKey.WorkspaceForms },
    { prefix: '/submissions', key: NavCapabilityKey.WorkspaceForms },
    { prefix: '/organization/directory', key: NavCapabilityKey.OrgDirectory },
    { prefix: '/organization/members', key: NavCapabilityKey.OrgDirectoryMembers },
    { prefix: '/organization/invitations', key: NavCapabilityKey.OrgDirectoryInvitations },
    { prefix: '/document-hub', key: NavCapabilityKey.CommonDocumentHub },
    { prefix: '/work-inbox', key: NavCapabilityKey.CommonWorkInbox },
    { prefix: '/my-insights', key: NavCapabilityKey.CommonMyInsights },
    { prefix: '/my-work', key: NavCapabilityKey.CommonMyInsights },
    { prefix: '/settings/capacity', key: NavCapabilityKey.WorkspaceCapacity },
    { prefix: '/settings/commercial', key: NavCapabilityKey.WorkspaceSettings },
    { prefix: '/settings/general', key: NavCapabilityKey.WorkspaceSettings },
    { prefix: '/settings/controlled-lists', key: NavCapabilityKey.WorkspaceSettings },
    { prefix: '/settings/knowledge', key: NavCapabilityKey.WorkspaceSettings },
    { prefix: '/settings/templates', key: NavCapabilityKey.CommonDocumentHub },
    { prefix: '/settings', key: NavCapabilityKey.WorkspaceSettings },
    { prefix: '/directory', key: NavCapabilityKey.WorkspaceDirectory },
    { prefix: '/members', key: NavCapabilityKey.WorkspaceDirectoryMembers },
    { prefix: '/teams', key: NavCapabilityKey.WorkspaceDirectoryTeams },
    { prefix: '/invitations', key: NavCapabilityKey.WorkspaceDirectoryInvitations },
    { prefix: '/join-requests', key: NavCapabilityKey.WorkspaceDirectoryJoinRequests },
    { prefix: '/projects', key: NavCapabilityKey.WorkspaceProjects },
    { prefix: '/activity', key: NavCapabilityKey.WorkspaceActivity },
    { prefix: '/governance', key: NavCapabilityKey.ProjectGovernance },
  ]

  for (const rule of workspaceRules) {
    if (rest === rule.prefix || rest.startsWith(rule.prefix + '/')) {
      return { key: rule.key, fallbackHref: wsHome }
    }
  }

  // Workspace root overview
  if (rest === '' || rest === '/') {
    return { key: NavCapabilityKey.WorkspaceOverview, fallbackHref: wsHome }
  }

  return null
}
