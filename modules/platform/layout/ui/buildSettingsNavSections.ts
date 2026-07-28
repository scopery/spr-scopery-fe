import type { ShellSidebarSection } from './ShellSidebar'
import { ROUTES } from '@/constants/routes'

export interface SettingsNavCapabilities {
  canManageWorkspace: boolean
  canManageMembers: boolean
  canInviteMembers: boolean
  canManageJoinRequests: boolean
  canViewTeams: boolean
  /** @deprecated Admin pages belong in Admin Console only — ignored when building settings. */
  canAccessAdmin: boolean
  isOrgOwner: boolean
  organizationId: string | null
  projectId: string | null
}

/**
 * Settings mode = Personal only + entry links to workspace/org/project settings.
 * Platform admin dumps live exclusively under Admin Console.
 */
export function buildSettingsNavSections(
  workspaceId: string,
  pathname: string | null,
  caps: SettingsNavCapabilities
): ShellSidebarSection[] {
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
        label: 'Security',
        href: ROUTES.account.security,
        active: isActive(ROUTES.account.security),
      },
      {
        label: 'Sessions',
        href: ROUTES.account.sessions,
        active: isActive(ROUTES.account.sessions),
      },
      {
        label: 'Join requests',
        href: ROUTES.account.joinRequests,
        active: isActive(ROUTES.account.joinRequests),
      },
      {
        label: 'My Notifications',
        href: ROUTES.workspace.notificationSettings(workspaceId),
        active: isActive(ROUTES.workspace.notificationSettings(workspaceId)),
      },
    ],
  })

  if (caps.canManageWorkspace) {
    sections.push({
      label: 'Workspace',
      items: [
        {
          label: 'Workspace settings',
          href: ROUTES.workspace.settingsGeneral(workspaceId),
          active: isActive(ROUTES.workspace.settingsGeneral(workspaceId)),
        },
        {
          label: 'Member permissions',
          href: ROUTES.workspace.settingsMemberPermissions(workspaceId),
          active: isActive(ROUTES.workspace.settingsMemberPermissions(workspaceId)),
        },
      ],
    })
  }

  if (caps.isOrgOwner) {
    sections.push({
      label: 'Organization',
      items: [
        {
          label: 'Organization settings',
          href: ROUTES.workspace.organizationDirectory(workspaceId),
          active:
            isActive(ROUTES.workspace.organizationDirectory(workspaceId)) ||
            isActive(`/workspace/${workspaceId}/organization/`),
        },
        {
          label: 'Member permissions',
          href: ROUTES.workspace.organizationMemberPermissions(workspaceId),
          active: isActive(ROUTES.workspace.organizationMemberPermissions(workspaceId)),
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
          label: 'Project settings',
          href: ROUTES.workspace.projectSettings(workspaceId, projectId),
          active: isActive(ROUTES.workspace.projectSettings(workspaceId, projectId)),
        },
        {
          label: 'Member permissions',
          href: ROUTES.workspace.projectMemberPermissions(workspaceId, projectId),
          active: isActive(ROUTES.workspace.projectMemberPermissions(workspaceId, projectId)),
        },
      ],
    })
  }

  return sections
}
