'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { PageSkeleton, Typography } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { MemberPermissionsPanel } from '@/modules/auth/iam/presentation/ui/MemberPermissionsPanel'
import { useWorkspaceMembers } from '@/modules/org/workspace/hooks/useWorkspaceMembers'
import { useAuth } from '@/modules/auth'

function isActive(status: string) {
  return status.toUpperCase() === 'ACTIVE'
}

export function WorkspaceMemberPermissionsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { session } = useAuth()
  const selfId = session?.user?.id
  const { members, loading } = useWorkspaceMembers(workspaceId)

  const memberUserIds = useMemo(
    () =>
      members
        .filter((m) => isActive(m.status) && m.userId !== selfId)
        .map((m) => m.userId),
    [members, selfId]
  )

  if (loading) return <PageSkeleton variant="list" />

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        current="Member permissions"
        className="mb-4"
      />
      <Typography as="h1" size="lg" weight="semibold" className="mb-2">
        Member permissions
      </Typography>
      <Typography variant="small" tone="muted" className="mb-4">
        Workspace-level permissions only (members, capacity, templates, clients…). Delivery rights
        inside a project are granted from that project’s Member permissions page.
      </Typography>
      <MemberPermissionsPanel
        scope={{ kind: 'workspace', workspaceId }}
        memberUserIds={memberUserIds}
        title="Workspace permissions"
        description="Grant workspace shell permissions. Default join permissions are shown locked. Project delivery is managed per project."
      />
    </div>
  )
}
