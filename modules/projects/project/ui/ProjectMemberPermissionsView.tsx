'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { PageSkeleton, Typography } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { MemberPermissionsPanel } from '@/modules/auth/iam/presentation/ui/MemberPermissionsPanel'
import { useWorkspaceMembers } from '@/modules/org/workspace/hooks/useWorkspaceMembers'
import { useAuth } from '@/modules/auth'
import { useProject } from '../hooks/useProject'

function isActive(status: string) {
  return status.toUpperCase() === 'ACTIVE'
}

export function ProjectMemberPermissionsView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const { session } = useAuth()
  const selfId = session?.user?.id
  const { project, loading: projectLoading } = useProject(workspaceId, projectId)
  const { members, loading: membersLoading } = useWorkspaceMembers(workspaceId)

  const memberUserIds = useMemo(
    () => members.filter((m) => isActive(m.status) && m.userId !== selfId).map((m) => m.userId),
    [members, selfId]
  )

  if (projectLoading || membersLoading) return <PageSkeleton variant="list" />

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={{ id: projectId, name: project?.name ?? 'Project' }}
        current="Member permissions"
        className="mb-1"
      />
      <div className="mb-2 border-b border-neutral-200 pb-2">
        <Typography as="h1" size="md" weight="medium">
          Project member permissions
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          Permissions for this project only (tasks, documents, finance, quality…). Workspace shell
          permissions are managed under Workspace settings. Members still need project access
          (Members → Access) to enter the project.
        </Typography>
      </div>
      <MemberPermissionsPanel
        scope={{ kind: 'project', projectId }}
        memberUserIds={memberUserIds}
        title="Project permissions"
        description="Grant delivery permissions on this project. Defaults from join are locked. Save to apply extras."
      />
    </div>
  )
}
