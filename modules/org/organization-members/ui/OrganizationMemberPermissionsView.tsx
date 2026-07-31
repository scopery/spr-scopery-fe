'use client'

import { useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { PageSkeleton, Typography } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { MemberPermissionsPanel } from '@/modules/auth/iam/presentation/ui/MemberPermissionsPanel'
import { useWorkspace } from '@/modules/org/workspace'
import { useAuth } from '@/modules/auth'
import { useOrganizationMembers } from '../hooks/useOrganizationMembers'
import { OrgMemberStatus } from '../model/organization-member'

export function OrganizationMemberPermissionsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { session } = useAuth()
  const selfId = session?.user?.id
  const { workspace, loading: wsLoading } = useWorkspace(workspaceId)
  const organizationId = workspace?.organizationId ?? null
  const { items, loading: membersLoading, load } = useOrganizationMembers(organizationId)

  useEffect(() => {
    void load()
  }, [load])

  const memberUserIds = useMemo(
    () =>
      items
        .filter((m) => m.status === OrgMemberStatus.Active && m.userId !== selfId)
        .map((m) => m.userId),
    [items, selfId]
  )

  if (wsLoading || membersLoading || !organizationId) {
    return <PageSkeleton variant="list" />
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        current="Organization permissions"
        className="mb-4"
      />
      <Typography as="h1" size="md" weight="medium" className="mb-1">
        Organization member permissions
      </Typography>
      <Typography variant="small" tone="muted" className="mb-4">
        Organization-level permissions only (org settings, teams…). Workspace and project rights are
        managed in their own Member permissions pages.
      </Typography>
      <MemberPermissionsPanel
        scope={{ kind: 'organization', organizationId }}
        memberUserIds={memberUserIds}
        title="Organization permissions"
        description="Grant organization-level permissions you can delegate. Defaults are shown locked when applicable."
      />
    </div>
  )
}
