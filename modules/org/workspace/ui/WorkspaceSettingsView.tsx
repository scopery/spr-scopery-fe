'use client'

import { Save } from 'lucide-react'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import NextLink from 'next/link'
import { Typography, Button, Stack, Input, Select, Badge, PageSkeleton } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { ROUTES } from '@/constants/routes'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { useWorkspaceSettings } from '../hooks/useWorkspaceSettings'
import { WorkspaceJoinPolicy, WorkspaceVisibility } from '../model/enums/workspace.enum'

const VISIBILITY_OPTIONS = [
  { value: WorkspaceVisibility.Private, label: 'Private' },
  { value: WorkspaceVisibility.Public, label: 'Public' },
]

const JOIN_POLICY_OPTIONS = [
  { value: WorkspaceJoinPolicy.InviteOnly, label: 'Invite only' },
  { value: WorkspaceJoinPolicy.RequestToJoin, label: 'Request to join' },
  { value: WorkspaceJoinPolicy.InviteOrRequest, label: 'Invite or request' },
  { value: WorkspaceJoinPolicy.Disabled, label: 'Disabled' },
]

export function WorkspaceSettingsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { canUpdateWorkspace, loading: authzLoading } = useWorkspaceAuthorization(workspaceId)
  const { workspace, loading, error, saving, save } = useWorkspaceSettings(workspaceId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultVisibility, setDefaultVisibility] = useState(WorkspaceVisibility.Private)
  const [joinPolicy, setJoinPolicy] = useState(WorkspaceJoinPolicy.InviteOnly)

  useEffect(() => {
    if (!workspace) return
    setName(workspace.name)
    setDescription(workspace.description ?? '')
    setDefaultVisibility(
      (workspace.defaultVisibility as typeof WorkspaceVisibility.Private) ||
        WorkspaceVisibility.Private
    )
    setJoinPolicy(
      (workspace.joinPolicy as typeof WorkspaceJoinPolicy.InviteOnly) ||
        WorkspaceJoinPolicy.InviteOnly
    )
  }, [workspace])

  if (loading || authzLoading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  if (error || !workspace) {
    return (
      <div>
        <WorkspaceHierarchyBreadcrumb
          workspaceId={workspaceId}
          current="Settings"
          className="mb-4"
        />
        <Typography tone="error">{error ?? 'Workspace not found'}</Typography>
      </div>
    )
  }

  if (!canUpdateWorkspace) {
    return (
      <div>
        <WorkspaceHierarchyBreadcrumb
          workspaceId={workspaceId}
          current="Settings"
          className="mb-4"
        />
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            You do not have permission to update workspace settings.
          </Typography>
          <NextLink
            href={ROUTES.workspace.projects(workspaceId)}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Back to projects
          </NextLink>
        </div>
      </div>
    )
  }

  const dirty =
    name.trim() !== workspace.name ||
    (description.trim() || '') !== (workspace.description ?? '') ||
    defaultVisibility !== workspace.defaultVisibility ||
    joinPolicy !== workspace.joinPolicy

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Settings" className="mb-4" />
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Typography as="h1" size="lg" weight="semibold">
              Workspace settings
            </Typography>
            <Badge
              variant="solid"
              tone={String(workspace.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
            >
              {String(workspace.status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          </div>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Name, description, visibility, and join policy.
          </Typography>
        </div>
      </div>

      <div className="max-w-lg border border-neutral-200 bg-white p-6">
        <Stack direction="vertical" spacing="md">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Visibility
            </Typography>
            <Select
              value={defaultVisibility}
              onValueChange={(v: string) =>
                setDefaultVisibility(v as typeof WorkspaceVisibility.Private)
              }
              options={VISIBILITY_OPTIONS}
              className="w-full"
            />
          </div>
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Join policy
            </Typography>
            <Select
              value={joinPolicy}
              onValueChange={(v: string) =>
                setJoinPolicy(v as typeof WorkspaceJoinPolicy.InviteOnly)
              }
              options={JOIN_POLICY_OPTIONS}
              className="w-full"
            />
          </div>
          <Typography as="div" variant="small" tone="muted">
            Code:{' '}
            <Typography as="span" variant="small" className="font-mono text-neutral-800">
              {workspace.code}
            </Typography>
          </Typography>
          <Button
            variant="primary"
            disabled={!dirty || !name.trim() || saving}
            onClick={() =>
              void save({
                name: name.trim(),
                description: description.trim() || undefined,
                defaultVisibility,
                joinPolicy,
              })
            } icon={<Save size={16} />}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </Stack>
      </div>
    </div>
  )
}
