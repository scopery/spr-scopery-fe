'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { FolderOpen, Settings } from 'lucide-react'
import { Typography, Stack, Badge, PageSkeleton, Button } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { ROUTES } from '@/constants/routes'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { useWorkspace } from '../hooks/useWorkspace'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function WorkspaceOverviewView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { workspace, loading, error } = useWorkspace(workspaceId)
  const { canUpdateWorkspace, canManageMembers, canInviteMembers } =
    useWorkspaceAuthorization(workspaceId)

  if (loading) {
    return (
      <PageSkeleton variant="cards" />
    )
  }

  if (error || !workspace) {
    return (
      <div>
        <Typography tone="error">{error ?? 'Workspace not found'}</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Overview" className="mb-4" />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Typography as="h1" size="lg" weight="semibold">
              {workspace.name}
            </Typography>
            <Badge
              variant="solid"
              tone={String(workspace.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
            >
              {String(workspace.status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          </div>
          <Typography as="p" variant="small" tone="muted" className="mt-1 font-mono">
            {workspace.code}
          </Typography>
          {workspace.description && (
            <Typography as="p" className="mt-3 max-w-2xl text-neutral-700">
              {workspace.description}
            </Typography>
          )}
        </div>
        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          <Button
            as={NextLink}
            href={ROUTES.workspace.projects(workspaceId)}
            variant="primary"
            icon={<FolderOpen size={16} />}
          >
            Open projects
          </Button>
          {canUpdateWorkspace && (
            <Button
              as={NextLink}
              href={ROUTES.workspace.settingsGeneral(workspaceId)}
              variant="outline"
              icon={<Settings size={16} />}
            >
              Settings
            </Button>
          )}
        </Stack>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border border-neutral-200 bg-white p-4">
          <Typography variant="small" tone="muted">
            Visibility
          </Typography>
          <Typography className="mt-1 font-medium">{workspace.defaultVisibility}</Typography>
        </div>
        <div className="border border-neutral-200 bg-white p-4">
          <Typography variant="small" tone="muted">
            Join policy
          </Typography>
          <Typography className="mt-1 font-medium">{workspace.joinPolicy}</Typography>
        </div>
        <div className="border border-neutral-200 bg-white p-4">
          <Typography variant="small" tone="muted">
            Created
          </Typography>
          <Typography className="mt-1 font-medium">{formatDate(workspace.createdAt)}</Typography>
        </div>
      </div>

      <div className="mt-8">
        <Typography as="h2" size="lg" weight="semibold" className="mb-3">
          Quick links
        </Typography>
        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          <NextLink
            href={ROUTES.workspace.directory(workspaceId)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Directory
          </NextLink>
          {canInviteMembers && (
            <NextLink
              href={ROUTES.workspace.directory(workspaceId, 'invitations')}
              className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              Invitations
            </NextLink>
          )}
          {canManageMembers && (
            <NextLink
              href={ROUTES.workspace.directory(workspaceId, 'members')}
              className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              Manage members
            </NextLink>
          )}
          <NextLink
            href={ROUTES.workspace.documentHub(workspaceId)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Document hub
          </NextLink>
        </Stack>
      </div>
    </div>
  )
}
