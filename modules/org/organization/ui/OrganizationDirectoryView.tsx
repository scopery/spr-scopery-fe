'use client'

import { useMemo } from 'react'
import NextLink from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { NavCapabilityKey, useNavCapabilities } from '@/modules/auth/iam'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { OrganizationMembersPanel } from '@/modules/org/organization-members/ui/OrganizationMembersPanel'
import { OrganizationInvitationsPanel } from '@/modules/org/organization-invitations/ui/OrganizationInvitationsPanel'
import { WorkspaceTeamsView } from '@/modules/org/teams/ui/WorkspaceTeamsView'
import { PageSkeleton, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

type OrgDirectoryTab = 'members' | 'invitations' | 'teams'

export function OrganizationDirectoryView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const searchParams = useSearchParams()
  const { workspaces } = useAuth()
  const organizationId = useMemo(
    () => workspaces.find((w) => w.id === workspaceId)?.organizationId ?? null,
    [workspaces, workspaceId]
  )

  const { can, loading: capsLoading } = useNavCapabilities({
    workspaceId,
    organizationId,
    packs: ['NAV_ORG'],
  })

  const tab = useMemo((): OrgDirectoryTab => {
    const raw = searchParams.get('tab')
    if (raw === 'invitations' || raw === 'teams') return raw
    return 'members'
  }, [searchParams])

  const tabs = useMemo(() => {
    const items: { id: OrgDirectoryTab; label: string; href: string }[] = []
    if (can(NavCapabilityKey.OrgDirectoryMembers)) {
      items.push({
        id: 'members',
        label: 'Members',
        href: ROUTES.workspace.organizationDirectory(workspaceId, 'members'),
      })
    }
    if (can(NavCapabilityKey.OrgDirectoryInvitations)) {
      items.push({
        id: 'invitations',
        label: 'Invitations',
        href: ROUTES.workspace.organizationDirectory(workspaceId, 'invitations'),
      })
    }
    if (can(NavCapabilityKey.OrgDirectoryTeams)) {
      items.push({
        id: 'teams',
        label: 'Teams',
        href: ROUTES.workspace.organizationDirectory(workspaceId, 'teams'),
      })
    }
    return items
  }, [workspaceId, can])

  const activeTab = useMemo((): OrgDirectoryTab => {
    if (tabs.some((t) => t.id === tab)) return tab
    return tabs[0]?.id ?? 'members'
  }, [tab, tabs])

  if (!organizationId || capsLoading) {
    return (
      <div className="space-y-4">
        <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Directory" />
        <PageSkeleton variant="split" />
        <Typography variant="small" tone="muted" className="text-center">
          Loading organization directory…
        </Typography>
      </div>
    )
  }

  if (tabs.length === 0) {
    return (
      <div className="space-y-4">
        <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Directory" />
        <Typography variant="small" tone="muted">
          You do not have permission to view organization directory.
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Directory" />

      <nav
        aria-label="Organization directory sections"
        className="-mb-px flex flex-wrap gap-0 border-b border-neutral-200"
      >
        {tabs.map((t) => (
          <NextLink
            key={t.id}
            href={t.href}
            aria-current={activeTab === t.id ? 'page' : undefined}
            className={cn(
              'motion-colors rounded-none border-b-2 border-transparent px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900',
              activeTab === t.id && 'border-primary font-medium text-neutral-900'
            )}
          >
            {t.label}
          </NextLink>
        ))}
      </nav>

      <div>
        {activeTab === 'members' ? (
          <OrganizationMembersPanel organizationId={organizationId} embedded />
        ) : null}
        {activeTab === 'invitations' ? (
          <OrganizationInvitationsPanel organizationId={organizationId} embedded />
        ) : null}
        {activeTab === 'teams' ? <WorkspaceTeamsView embedded /> : null}
      </div>
    </div>
  )
}
