'use client'

/** Capability keys returned by BE nav packs — keep in sync with NavCapabilityDefinitions.java */

export const NavCapabilityKey = {
  // Org
  OrgDirectory: 'org.directory',
  OrgDirectoryMembers: 'org.directory.members',
  OrgDirectoryInvitations: 'org.directory.invitations',
  OrgDirectoryTeams: 'org.directory.teams',
  OrgCreateWorkspace: 'org.create_workspace',
  OrgSettings: 'org.settings',
  // Workspace
  WorkspaceOverview: 'workspace.overview',
  WorkspaceActivity: 'workspace.activity',
  WorkspaceProjects: 'workspace.projects',
  WorkspaceProjectsCreate: 'workspace.projects.create',
  WorkspaceCapacity: 'workspace.capacity',
  WorkspaceClients: 'workspace.clients',
  WorkspaceApplications: 'workspace.applications',
  WorkspaceSupport: 'workspace.support',
  WorkspaceForms: 'workspace.forms',
  WorkspaceDirectory: 'workspace.directory',
  WorkspaceDirectoryMembers: 'workspace.directory.members',
  WorkspaceDirectoryTeams: 'workspace.directory.teams',
  WorkspaceDirectoryInvitations: 'workspace.directory.invitations',
  WorkspaceDirectoryJoinRequests: 'workspace.directory.join_requests',
  WorkspaceSettings: 'workspace.settings',
  // Common
  CommonDocumentHub: 'common.document_hub',
  CommonSearch: 'common.search',
  CommonMyInsights: 'common.my_insights',
  CommonWorkInbox: 'common.work_inbox',
  CommonNotifications: 'common.notifications',
  CommonAiAssistant: 'common.ai_assistant',
  // Project
  ProjectOverview: 'project.overview',
  ProjectWork: 'project.work',
  ProjectWbs: 'project.wbs',
  ProjectTimeline: 'project.timeline',
  ProjectSchedule: 'project.schedule',
  ProjectResources: 'project.resources',
  ProjectScope: 'project.scope',
  ProjectDeliverables: 'project.deliverables',
  ProjectRequirements: 'project.requirements',
  ProjectFunctionalCatalog: 'project.functional_catalog',
  ProjectApplicationStructure: 'project.application_structure',
  ProjectTraceability: 'project.traceability',
  ProjectQuality: 'project.quality',
  ProjectTestPlans: 'project.test_plans',
  ProjectDefects: 'project.defects',
  ProjectReleases: 'project.releases',
  ProjectEstimation: 'project.estimation',
  ProjectFinancials: 'project.financials',
  ProjectProfitability: 'project.profitability',
  ProjectQuotes: 'project.quotes',
  ProjectRaid: 'project.raid',
  ProjectDecisions: 'project.decisions',
  ProjectBaselines: 'project.baselines',
  ProjectChangeRequests: 'project.change_requests',
  ProjectGovernance: 'project.governance',
  ProjectMeetings: 'project.meetings',
  ProjectClientCollaboration: 'project.client_collaboration',
  ProjectAiPlanning: 'project.ai_planning',
  ProjectRecommendations: 'project.recommendations',
  ProjectReports: 'project.reports',
  ProjectDashboard: 'project.dashboard',
  ProjectDirectory: 'project.directory',
  ProjectDirectoryMembers: 'project.directory.members',
  // Settings
  SettingsPersonal: 'settings.personal',
  SettingsWorkspaceEntry: 'settings.workspace_entry',
  SettingsOrganizationEntry: 'settings.organization_entry',
  SettingsProjectEntry: 'settings.project_entry',
} as const

export type NavCapabilityKey = (typeof NavCapabilityKey)[keyof typeof NavCapabilityKey]

export type NavCapabilityPack =
  | 'NAV_ORG'
  | 'NAV_WORKSPACE'
  | 'NAV_PROJECT'
  | 'NAV_SETTINGS'

export interface CapabilitiesResponse {
  resourceType: string
  resourceRefId: string
  pack: string
  capabilities: Record<string, boolean>
}
