'use client'

import { useEffect, useMemo } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { WorkspaceMembersView } from './WorkspaceMembersView'
import { WorkspaceInvitationsView } from '../../workspace-invitations/ui/WorkspaceInvitationsView'
import { WorkspaceJoinRequestsView } from '../../join-requests/ui/WorkspaceJoinRequestsView'
import { cn } from '@/utils/cn'

type DirectoryTab = 'members' | 'invitations' | 'join-requests'

/** Workspace-scoped directory only (members / invitations / join requests). Org teams live under Organization → Directory. */
export function WorkspaceDirectoryView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { workspaces } = useAuth()
  const workspace = workspaces.find((w) => w.id === workspaceId)
  const { canInviteMembers, canManageJoinRequests } = useWorkspaceAuthorization(
    workspaceId,
    workspace?.organizationId
  )

  // Legacy: Teams belonged under workspace directory — send to Organization directory.
  useEffect(() => {
    if (searchParams.get('tab') === 'teams') {
      router.replace(ROUTES.workspace.organizationDirectory(workspaceId, 'teams'))
    }
  }, [searchParams, router, workspaceId])

  const tab = useMemo((): DirectoryTab => {
    const raw = searchParams.get('tab')
    if (raw === 'invitations' || raw === 'join-requests') return raw
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
  }, [workspaceId, canInviteMembers, canManageJoinRequests])

  return (
    <div className="space-y-4">
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Directory" />

      <nav
        aria-label="Workspace directory sections"
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
        {tab === 'invitations' ? <WorkspaceInvitationsView embedded /> : null}
        {tab === 'join-requests' ? <WorkspaceJoinRequestsView embedded /> : null}
      </div>
    </div>
  )
}
