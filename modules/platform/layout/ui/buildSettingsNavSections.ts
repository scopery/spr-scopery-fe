import type { ShellSidebarSection } from './ShellSidebar'
import { ROUTES } from '@/constants/routes'

export interface SettingsNavCapabilities {
  canManageWorkspace: boolean
  canManageMembers: boolean
  canInviteMembers: boolean
  canManageJoinRequests: boolean
  canViewTeams: boolean
  canAccessAdmin: boolean
  isOrgOwner: boolean
  organizationId: string | null
  projectId: string | null
}

export function buildSettingsNavSections(
  workspaceId: string,
  pathname: string | null,
  caps: SettingsNavCapabilities
): ShellSidebarSection[] {
  const orgId = caps.organizationId
  const sections: ShellSidebarSection[] = []

  const isActive = (href: string) => {
    const base = href.split('?')[0]
    return pathname === base || (pathname?.startsWith(base + '/') ?? false)
  }

  sections.push({
    label: 'Personal',
    items: [
      {
        label: 'Profile',
        href: ROUTES.account.profile,
        active: isActive(ROUTES.account.profile),
      },
      {
        label: 'Preferences',
        href: ROUTES.account.root,
        active: pathname === ROUTES.account.root,
      },
      {
        label: 'My Notifications',
        href: ROUTES.workspace.notificationSettings(workspaceId),
        active: isActive(ROUTES.workspace.notificationSettings(workspaceId)),
      },
    ],
  })

  if (caps.isOrgOwner && !caps.canAccessAdmin) {
    sections.push({
      label: 'Organization',
      items: [
        {
          label: 'Members',
          href: ROUTES.workspace.organizationMembers(workspaceId),
          active: isActive(ROUTES.workspace.organizationMembers(workspaceId)),
        },
        {
          label: 'Invitations',
          href: ROUTES.workspace.organizationInvitations(workspaceId),
          active: isActive(ROUTES.workspace.organizationInvitations(workspaceId)),
        },
      ],
    })
  }

  if (caps.canAccessAdmin) {
    sections.push({
      label: 'Organization',
      items: [
        {
          label: 'General',
          href: orgId ? ROUTES.admin.organization(orgId) : ROUTES.admin.organizations,
          active: orgId
            ? isActive(ROUTES.admin.organization(orgId))
            : isActive(ROUTES.admin.organizations),
        },
        {
          label: 'Workspaces',
          href: orgId
            ? ROUTES.admin.organizationWorkspaces(orgId)
            : ROUTES.admin.workspaces,
          active: orgId
            ? isActive(ROUTES.admin.organizationWorkspaces(orgId))
            : isActive(ROUTES.admin.workspaces),
        },
        {
          label: 'Members',
          href: orgId
            ? ROUTES.workspace.organizationMembers(workspaceId)
            : ROUTES.admin.organizations,
          active: isActive(ROUTES.workspace.organizationMembers(workspaceId)),
        },
        {
          label: 'Invitations',
          href: ROUTES.workspace.organizationInvitations(workspaceId),
          active: isActive(ROUTES.workspace.organizationInvitations(workspaceId)),
        },
        {
          label: 'Access',
          href: ROUTES.admin.workspaceAccess(workspaceId),
          active: isActive(ROUTES.admin.workspaceAccess(workspaceId)),
        },
      ],
    })
  }

  if (caps.canManageWorkspace || caps.canManageMembers) {
    sections.push({
      label: 'Workspace',
      items: [
        {
          label: 'General',
          href: ROUTES.workspace.settingsGeneral(workspaceId),
          active: isActive(ROUTES.workspace.settingsGeneral(workspaceId)),
        },
        {
          label: 'Directory',
          href: ROUTES.workspace.directory(workspaceId),
          active:
            isActive(`/workspace/${workspaceId}/directory`) ||
            isActive(ROUTES.workspace.members(workspaceId)) ||
            isActive(ROUTES.workspace.teams(workspaceId)) ||
            isActive(ROUTES.workspace.invitations(workspaceId)) ||
            isActive(ROUTES.workspace.joinRequests(workspaceId)),
        },
      ],
    })
  }

  if (caps.projectId) {
    const projectId = caps.projectId
    sections.push({
      label: 'Project',
      items: [
        {
          label: 'General',
          href: ROUTES.workspace.projectSettings(workspaceId, projectId),
          active: isActive(ROUTES.workspace.projectSettings(workspaceId, projectId)),
        },
        {
          label: 'Phases',
          href: ROUTES.workspace.projectSettings(workspaceId, projectId),
          active: false,
        },
        {
          label: 'Lifecycle',
          href: ROUTES.workspace.projectSettings(workspaceId, projectId),
          active: false,
        },
        {
          label: 'Notifications',
          href: ROUTES.workspace.notificationSettings(workspaceId),
          active: false,
        },
      ],
    })
  }

  if (caps.canAccessAdmin) {
    sections.push({
      label: 'People & Access',
      items: [
        {
          label: 'Users',
          href: ROUTES.admin.iamUsers,
          active: isActive(ROUTES.admin.iamUsers),
        },
        {
          label: 'Roles & Permissions',
          href: ROUTES.admin.iamRoles,
          active: isActive(ROUTES.admin.iamRoles) || isActive(ROUTES.admin.iamPermissions),
        },
        {
          label: 'Assignments',
          href: ROUTES.admin.iamRoleAssignments,
          active: isActive(ROUTES.admin.iamRoleAssignments),
        },
        {
          label: 'Grants',
          href: ROUTES.admin.iamGrants,
          active: isActive(ROUTES.admin.iamGrants),
        },
        {
          label: 'Authorization Tester',
          href: ROUTES.admin.iamAuthorizationCheck,
          active:
            isActive(ROUTES.admin.iamAuthorizationCheck) ||
            isActive(ROUTES.admin.iamAuthorizationExplain),
        },
      ],
    })

    sections.push({
      label: 'Project Standards',
      items: [
        {
          label: 'Phase Definitions',
          href: ROUTES.admin.phaseDefinitions,
          active: isActive(ROUTES.admin.phaseDefinitions),
        },
        {
          label: 'Project Templates',
          href: ROUTES.admin.projectTemplates,
          active: isActive(ROUTES.admin.projectTemplates),
        },
      ],
    })

    sections.push({
      label: 'Costs',
      items: [
        {
          label: 'Cost Rate Cards',
          href: ROUTES.admin.workspaceRateCards(workspaceId),
          active: isActive(ROUTES.admin.workspaceRateCards(workspaceId)),
        },
        {
          label: 'Rate Resolution',
          href: ROUTES.admin.workspaceRateResolve(workspaceId),
          active: isActive(ROUTES.admin.workspaceRateResolve(workspaceId)),
        },
        {
          label: 'Rate Setup',
          href: ROUTES.admin.workspaceRateSetup(workspaceId),
          active: isActive(ROUTES.admin.workspaceRateSetup(workspaceId)),
        },
      ],
    })

    sections.push({
      label: 'Commercial',
      items: [
        {
          label: 'Billing Rate Cards',
          href: ROUTES.workspace.settingsBillingRateCards(workspaceId),
          active: isActive(ROUTES.workspace.settingsBillingRateCards(workspaceId)),
        },
      ],
    })

    sections.push({
      label: 'Notification Administration',
      items: [
        {
          label: 'Email Templates',
          href: ROUTES.admin.nadEmailTemplates,
          active: isActive(ROUTES.admin.nadEmailTemplates),
        },
        {
          label: 'Email Rules',
          href: ROUTES.admin.nadEmailRules,
          active: isActive(ROUTES.admin.nadEmailRules),
        },
        {
          label: 'Automation',
          href: ROUTES.admin.nadAutomation,
          active: isActive(ROUTES.admin.nadAutomation),
        },
        {
          label: 'Delivery Operations',
          href: ROUTES.admin.nadDeliveries,
          active: isActive(ROUTES.admin.nadDeliveries),
        },
      ],
    })

    sections.push({
      label: 'Security',
      items: [
        {
          label: 'Audit Log',
          href: ROUTES.admin.platformAuditEvents,
          active: isActive(ROUTES.admin.platformAuditEvents),
        },
        {
          label: 'Sessions',
          href: ROUTES.account.sessions,
          active: isActive(ROUTES.account.sessions),
        },
      ],
    })
  }

  if (caps.canManageWorkspace) {
    sections.push({
      label: 'Configuration',
      items: [
        {
          label: 'Forms',
          href: ROUTES.workspace.forms(workspaceId),
          active: isActive(ROUTES.workspace.forms(workspaceId)),
        },
        {
          label: 'Controlled Lists',
          href: ROUTES.workspace.settingsControlledLists(workspaceId),
          active: isActive(
            ROUTES.workspace.settingsControlledLists(workspaceId).split('?')[0]
          ),
        },
        {
          label: 'Capacity Setup',
          href: ROUTES.workspace.settingsCapacity(workspaceId),
          active: isActive(ROUTES.workspace.settingsCapacity(workspaceId)),
        },
        {
          label: 'Billing Rate Cards',
          href: ROUTES.workspace.settingsBillingRateCards(workspaceId),
          active: isActive(ROUTES.workspace.settingsBillingRateCards(workspaceId)),
        },
        {
          label: 'Rate Lookup',
          href: ROUTES.workspace.ratesLookup(workspaceId),
          active: isActive(ROUTES.workspace.ratesLookup(workspaceId)),
        },
      ],
    })

    sections.push({
      label: 'Services',
      items: [
        {
          label: 'Knowledge & Documents',
          href: ROUTES.workspace.settingsKnowledge(workspaceId),
          active: isActive(ROUTES.workspace.settingsKnowledge(workspaceId)),
        },
        {
          label: 'Integrations',
          href: ROUTES.workspace.settingsIntegrations(workspaceId),
          active: isActive(ROUTES.workspace.settingsIntegrations(workspaceId)),
        },
        {
          label: 'Trust & Compliance',
          href: ROUTES.workspace.settingsTrust(workspaceId),
          active: isActive(ROUTES.workspace.settingsTrust(workspaceId)),
        },
        {
          label: 'Service Support',
          href: ROUTES.workspace.settingsSupport(workspaceId),
          active: isActive(ROUTES.workspace.settingsSupport(workspaceId)),
        },
      ],
    })
  }

  return sections
}
