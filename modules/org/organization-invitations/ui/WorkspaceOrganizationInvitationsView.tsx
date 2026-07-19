'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Typography, PageSkeleton } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { OrganizationInvitationsPanel } from './OrganizationInvitationsPanel'

export function WorkspaceOrganizationInvitationsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { workspaces } = useAuth()
  const organizationId = useMemo(
    () => workspaces.find((w) => w.id === workspaceId)?.organizationId ?? null,
    [workspaces, workspaceId]
  )

  if (!organizationId) {
    return (
      <div>
        <WorkspaceHierarchyBreadcrumb
          workspaceId={workspaceId}
          current="Organization invitations"
          className="mb-4"
        />
        <PageSkeleton variant="list" />
        <Typography variant="small" tone="muted" className="text-center">
          Loading organization context…
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        current="Organization invitations"
        className="mb-4"
      />
      <OrganizationInvitationsPanel organizationId={organizationId} />
    </div>
  )
}
