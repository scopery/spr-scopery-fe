'use client'

import { useMemo } from 'react'
import NextLink from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { WorkspaceMembersView } from './WorkspaceMembersView'
import { WorkspaceTeamsView } from '../../teams/ui/WorkspaceTeamsView'
import { WorkspaceInvitationsView } from '../../workspace-invitations/ui/WorkspaceInvitationsView'
import { WorkspaceJoinRequestsView } from '../../join-requests/ui/WorkspaceJoinRequestsView'
import { cn } from '@/utils/cn'

type DirectoryTab = 'members' | 'teams' | 'invitations' | 'join-requests'

export function WorkspaceDirectoryView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const searchParams = useSearchParams()
  const { workspaces } = useAuth()
  const workspace = workspaces.find((w) => w.id === workspaceId)
  const { canInviteMembers, canManageJoinRequests, canViewTeams } = useWorkspaceAuthorization(
    workspaceId,
    workspace?.organizationId
  )

  const tab = useMemo((): DirectoryTab => {
    const raw = searchParams.get('tab')
    if (raw === 'teams' || raw === 'invitations' || raw === 'join-requests') return raw
    return 'members'
  }, [searchParams])

  const tabs = useMemo(() => {
    const items: { id: DirectoryTab; label: string; href: string }[] = [
      {
        id: 'members',
        label: 'Members',
        href: ROUTES.workspace.directory(workspaceId, 'members'),
      },
    ]
    if (canViewTeams) {
      items.push({
        id: 'teams',
        label: 'Teams',
        href: ROUTES.workspace.directory(workspaceId, 'teams'),
      })
    }
    if (canInviteMembers) {
      items.push({
        id: 'invitations',
        label: 'Invitations',
        href: ROUTES.workspace.directory(workspaceId, 'invitations'),
      })
    }
    if (canManageJoinRequests) {
      items.push({
        id: 'join-requests',
        label: 'Join requests',
        href: ROUTES.workspace.directory(workspaceId, 'join-requests'),
      })
    }
    return items
  }, [workspaceId, canViewTeams, canInviteMembers, canManageJoinRequests])

  return (
    <div className="space-y-4">
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Directory" />

      <nav
        aria-label="Directory sections"
        className="-mb-px flex flex-wrap gap-0 border-b border-neutral-200"
      >
        {tabs.map((t) => (
          <NextLink
            key={t.id}
            href={t.href}
            aria-current={tab === t.id ? 'page' : undefined}
            className={cn(
              'rounded-none border-b-2 border-transparent px-3 py-2 text-sm text-neutral-600 motion-colors hover:text-neutral-900',
              tab === t.id && 'border-primary font-medium text-neutral-900'
            )}
          >
            {t.label}
          </NextLink>
        ))}
      </nav>

      <div>
        {tab === 'members' ? <WorkspaceMembersView embedded /> : null}
        {tab === 'teams' ? <WorkspaceTeamsView embedded /> : null}
        {tab === 'invitations' ? <WorkspaceInvitationsView embedded /> : null}
        {tab === 'join-requests' ? <WorkspaceJoinRequestsView embedded /> : null}
      </div>
    </div>
  )
}
