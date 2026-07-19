'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Archive, ArrowLeft, Check, Save } from 'lucide-react'
import { Typography, Button, Stack, PageSkeleton, Input, Select } from '@/shared/ui'
import { useAdminWorkspaceDetail } from '../hooks/useAdminWorkspaceDetail'
import { AdminWorkspaceStatusBadge } from './AdminWorkspaceStatusBadge'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import type { Workspace } from '../../domain/model/workspace'
import {
  WorkspaceJoinPolicy,
  WorkspaceStatus,
  WorkspaceVisibility,
} from '../../domain/enums/workspace.enum'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

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

export function AdminWorkspaceDetailView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { data, loading, error, acting, saving, save, runAction } =
    useAdminWorkspaceDetail(workspaceId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultVisibility, setDefaultVisibility] = useState<string>(WorkspaceVisibility.Private)
  const [joinPolicy, setJoinPolicy] = useState<string>(WorkspaceJoinPolicy.InviteOnly)

  useEffect(() => {
    if (!data) return
    setName(data.name)
    setDescription(data.description ?? '')
    setDefaultVisibility(data.defaultVisibility)
    setJoinPolicy(data.joinPolicy)
  }, [data])

  if (loading) {
    return <PageSkeleton variant="detail" />
  }

  if (error || !data) {
    return (
      <div>
        <NextLink
          href={ADMIN_ROUTES.workspaces}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={14} /> Back to Workspaces
        </NextLink>
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error ?? 'Workspace not found'}
          </Typography>
        </div>
      </div>
    )
  }

  const dirty =
    name.trim() !== data.name ||
    (description.trim() || '') !== (data.description ?? '') ||
    defaultVisibility !== data.defaultVisibility ||
    joinPolicy !== data.joinPolicy

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.workspaces}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Workspaces
      </NextLink>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Typography as="h1" size="lg" weight="semibold">
              {data.name}
            </Typography>
            <AdminWorkspaceStatusBadge status={data.status} />
          </div>
          <Typography as="p" variant="small" tone="muted" className="mt-1 font-mono">
            {data.code}
          </Typography>
        </div>
        <Stack direction="horizontal" spacing="sm">
          {data.status === WorkspaceStatus.Archived ? (
            <Button
              variant="outline"
              disabled={acting}
              onClick={() => void runAction('activate')} icon={<Check size={16} />}>
              Activate
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={acting}
              onClick={() => void runAction('archive')} icon={<Archive size={16} />}>
              Archive
            </Button>
          )}
          <NextLink
            href={ADMIN_ROUTES.workspaceMembers(data.id)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Members
          </NextLink>
          <NextLink
            href={ADMIN_ROUTES.workspaceTeams(data.id)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Teams
          </NextLink>
          <NextLink
            href={ADMIN_ROUTES.workspaceAccess(data.id)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Access
          </NextLink>
          <NextLink
            href={ADMIN_ROUTES.workspaceClients(data.id)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Clients
          </NextLink>
          <NextLink
            href={ADMIN_ROUTES.workspaceRateCards(data.id)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Rates
          </NextLink>
          <NextLink
            href={ADMIN_ROUTES.workspaceConfig(data.id)}
            className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Config
          </NextLink>
        </Stack>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-neutral-200 bg-white p-6">
          <Typography as="h2" size="lg" weight="semibold" className="mb-4">
            Settings
          </Typography>
          <Stack direction="vertical" spacing="md">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div>
              <Typography variant="small" tone="muted" className="mb-1.5">
                Default visibility
              </Typography>
              <Select
                value={defaultVisibility}
                onValueChange={setDefaultVisibility}
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
                onValueChange={setJoinPolicy}
                options={JOIN_POLICY_OPTIONS}
                className="w-full"
              />
            </div>
            <Button
              variant="primary"
              disabled={!dirty || !name.trim() || saving}
              onClick={() =>
                void save({
                  name: name.trim(),
                  description: description.trim() || undefined,
                  defaultVisibility: defaultVisibility as Workspace['defaultVisibility'],
                  joinPolicy: joinPolicy as Workspace['joinPolicy'],
                })
              } icon={<Save size={16} />}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </div>

        <div className="border border-neutral-200 bg-white p-6">
          <Typography as="h2" size="lg" weight="semibold" className="mb-4">
            Metadata
          </Typography>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-neutral-500">Workspace ID</dt>
              <dd className="mt-0.5 font-mono text-xs">{data.id}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Organization</dt>
              <dd className="mt-0.5">
                <NextLink
                  href={ADMIN_ROUTES.organization(data.organizationId)}
                  className="font-mono text-xs text-primary hover:underline"
                >
                  {data.organizationId}
                </NextLink>
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Owner user ID</dt>
              <dd className="mt-0.5 font-mono text-xs">{data.ownerUserId ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Created</dt>
              <dd className="mt-0.5">{formatDate(data.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Updated</dt>
              <dd className="mt-0.5">{formatDate(data.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
