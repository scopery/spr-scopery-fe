'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Ban, Plus, Trash2 } from 'lucide-react'
import { Typography, Button, Stack, PageSkeleton, Input } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamGrantDetail } from '../hooks/useIamGrantDetail'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'
import { IamEntityIdentityCard } from './IamEntityIdentityCard'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminIamGrantDetailView() {
  const { grantId } = useParams<{ grantId: string }>()
  const {
    grant,
    grantRights,
    rightsById,
    actions,
    loading,
    error,
    revoking,
    acting,
    revoke,
    addRight,
    removeRight,
    addAction,
    removeAction,
  } = useIamGrantDetail(grantId)
  const { usersById, rolesById, resourcesById, workspacesById } = useIamIdentityDirectory({
    userIds: [grant?.subjectType === 'USER' ? grant.subjectId : null, grant?.grantedBy],
    roleIds: [grant?.subjectType === 'ROLE' ? grant.subjectId : null, grant?.roleId],
    resourceIds: [grant?.resourceId],
    workspaceIds: [grant?.workspaceId, grant?.scopeRefId],
  })

  const [rightIdDraft, setRightIdDraft] = useState('')
  const [actionDraft, setActionDraft] = useState({
    permissionActionId: '',
    permissionCode: '',
    actionCode: '',
  })

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
  }

  if (error || !grant) {
    return (
      <div>
        <NextLink
          href={ADMIN_ROUTES.iamGrants}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={14} /> Back to Grants
        </NextLink>
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error ?? 'Grant not found'}
          </Typography>
        </div>
      </div>
    )
  }

  const fields = [
    { label: 'Grant ID', value: grant.id, mono: true },
    { label: 'Subject type', value: grant.subjectType },
    { label: 'Effect', value: grant.effect },
    { label: 'Scope type', value: grant.scopeType ?? '—' },
    { label: 'Status', value: grant.status },
    { label: 'Granted at', value: grant.grantedAt ? formatDate(grant.grantedAt) : '—' },
    { label: 'Created', value: formatDate(grant.createdAt) },
    { label: 'Updated', value: formatDate(grant.updatedAt) },
  ]

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamGrants}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Grants
      </NextLink>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Typography as="h1" size="lg" weight="semibold">
              Grant detail
            </Typography>
            <IamStatusBadge status={grant.status} />
          </div>
          <Typography as="p" variant="small" tone="muted" className="mt-1 font-mono text-xs">
            {grant.id}
          </Typography>
        </div>
        <Stack direction="horizontal" spacing="sm">
          <NextLink
            href={`${ADMIN_ROUTES.iamDelegationNew}?resourceRefId=${encodeURIComponent(grant.resourceId)}`}
            className="inline-flex items-center border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            Delegate
          </NextLink>
          <Button
            variant="outline"
            tone="error"
            disabled={revoking || grant.status !== 'ACTIVE'}
            onClick={() => void revoke()} icon={<Ban size={16} />}>
            {revoking ? 'Revoking…' : 'Revoke'}
          </Button>
        </Stack>
      </div>

      <div className="mb-8 max-w-2xl border border-neutral-200 bg-white">
        <div className="grid gap-4 border-b border-neutral-100 p-4 md:grid-cols-2">
          <div>
            <Typography variant="small" tone="muted" className="mb-2">
              Subject
            </Typography>
            {grant.subjectType === 'USER' && usersById[grant.subjectId] ? (
              <IamEntityIdentityCard
                title={usersById[grant.subjectId].fullName || usersById[grant.subjectId].username}
                subtitle={`@${usersById[grant.subjectId].username}`}
                meta={usersById[grant.subjectId].email}
                id={grant.subjectId}
                avatarFallback={usersById[grant.subjectId].fullName || usersById[grant.subjectId].username}
                badge={grant.subjectType}
              />
            ) : grant.subjectType === 'ROLE' && rolesById[grant.subjectId] ? (
              <IamEntityIdentityCard
                title={rolesById[grant.subjectId].name}
                subtitle={rolesById[grant.subjectId].code}
                meta={rolesById[grant.subjectId].roleScope}
                id={grant.subjectId}
                badge={grant.subjectType}
              />
            ) : (
              <IamEntityIdentityCard title={grant.subjectId} subtitle={grant.subjectType} id={grant.subjectId} />
            )}
          </div>
          <div>
            <Typography variant="small" tone="muted" className="mb-2">
              Resource
            </Typography>
            {resourcesById[grant.resourceId] ? (
              <IamEntityIdentityCard
                title={resourcesById[grant.resourceId].name}
                subtitle={resourcesById[grant.resourceId].code}
                meta={resourcesById[grant.resourceId].resourceType}
                id={grant.resourceId}
              />
            ) : (
              <IamEntityIdentityCard title={grant.resourceId} id={grant.resourceId} />
            )}
          </div>
          {grant.roleId ? (
            <div>
              <Typography variant="small" tone="muted" className="mb-2">
                Role
              </Typography>
              {rolesById[grant.roleId] ? (
                <IamEntityIdentityCard
                  title={rolesById[grant.roleId].name}
                  subtitle={rolesById[grant.roleId].code}
                  meta={rolesById[grant.roleId].roleScope}
                  id={grant.roleId}
                />
              ) : (
                <IamEntityIdentityCard title={grant.roleId} id={grant.roleId} />
              )}
            </div>
          ) : null}
          {grant.workspaceId ? (
            <div>
              <Typography variant="small" tone="muted" className="mb-2">
                Workspace
              </Typography>
              {workspacesById[grant.workspaceId] ? (
                <IamEntityIdentityCard
                  title={workspacesById[grant.workspaceId].name}
                  subtitle={workspacesById[grant.workspaceId].code}
                  meta={workspacesById[grant.workspaceId].status}
                  id={grant.workspaceId}
                />
              ) : (
                <IamEntityIdentityCard title={grant.workspaceId} id={grant.workspaceId} />
              )}
            </div>
          ) : null}
        </div>
        <div className="divide-y divide-neutral-100">
          {fields.map(({ label, value, mono }) => (
            <div key={label} className="flex items-start gap-4 px-4 py-3">
              <Typography variant="small" tone="muted" className="w-32 shrink-0">
                {label}
              </Typography>
              <Typography
                variant="small"
                weight="medium"
                className={cn('flex-1 break-all', mono && 'font-mono text-xs')}
              >
                {value}
              </Typography>
            </div>
          ))}
          <div className="flex items-start gap-4 px-4 py-3">
            <Typography variant="small" tone="muted" className="w-32 shrink-0">
              Scope ref
            </Typography>
            <div className="flex-1">
              {grant.scopeRefId ? (
                workspacesById[grant.scopeRefId] ? (
                  <IamEntityIdentityCard
                    title={workspacesById[grant.scopeRefId].name}
                    subtitle={workspacesById[grant.scopeRefId].code}
                    meta={grant.scopeType ?? undefined}
                    id={grant.scopeRefId}
                  />
                ) : (
                  <IamEntityIdentityCard title={grant.scopeRefId} subtitle={grant.scopeType ?? undefined} id={grant.scopeRefId} />
                )
              ) : (
                <Typography variant="small">—</Typography>
              )}
            </div>
          </div>
          <div className="flex items-start gap-4 px-4 py-3">
            <Typography variant="small" tone="muted" className="w-32 shrink-0">
              Granted by
            </Typography>
            <div className="flex-1">
              {grant.grantedBy ? (
                usersById[grant.grantedBy] ? (
                  <IamEntityIdentityCard
                    title={usersById[grant.grantedBy].fullName || usersById[grant.grantedBy].username}
                    subtitle={`@${usersById[grant.grantedBy].username}`}
                    meta={usersById[grant.grantedBy].email}
                    id={grant.grantedBy}
                    avatarFallback={usersById[grant.grantedBy].fullName || usersById[grant.grantedBy].username}
                  />
                ) : (
                  <IamEntityIdentityCard title={grant.grantedBy} id={grant.grantedBy} />
                )
              ) : (
                <Typography variant="small">—</Typography>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <Typography as="h2" size="lg" weight="semibold">
          Rights
        </Typography>
        {grant.status === 'ACTIVE' ? (
          <Stack direction="horizontal" spacing="sm" className="items-end">
            <Input
              label="Right ID"
              value={rightIdDraft}
              onChange={(e) => setRightIdDraft(e.target.value)}
              placeholder="uuid"
              className="w-64"
            />
            <Button
              variant="primary"
              disabled={acting || !rightIdDraft.trim()}
              onClick={() =>
                void addRight(rightIdDraft).then(() => setRightIdDraft(''))
              }
              icon={<Plus size={16} />}
            >
              Add right
            </Button>
          </Stack>
        ) : null}
      </div>
      {grantRights.length === 0 ? (
        <div className="mb-8 border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center">
          <Typography tone="muted" variant="small">
            No rights attached to this grant.
          </Typography>
        </div>
      ) : (
        <div className="mb-8 overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Right ID</th>
                <th className="px-4 py-3 font-medium">Attached</th>
                <th className="min-w-[8rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {grantRights.map((row) => {
                const right = rightsById[row.rightId]
                return (
                  <tr key={`${row.grantId}:${row.rightId}`} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-mono text-xs">{right?.code ?? '—'}</td>
                    <td className="px-4 py-3">{right?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{right?.module ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.rightId}</td>
                    <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {grant.status === 'ACTIVE' ? (
                        <Button
                          variant="ghost"
                          tone="error"
                          disabled={acting}
                          onClick={() => void removeRight(row.rightId)}
                          icon={<Trash2 size={16} />}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <Typography as="h2" size="lg" weight="semibold">
          Permission actions
        </Typography>
        {grant.status === 'ACTIVE' ? (
          <Stack direction="horizontal" spacing="sm" className="flex-wrap items-end">
            <Input
              label="Permission action ID"
              value={actionDraft.permissionActionId}
              onChange={(e) =>
                setActionDraft((d) => ({ ...d, permissionActionId: e.target.value }))
              }
              placeholder="optional uuid"
              className="w-48"
            />
            <Input
              label="Permission code"
              value={actionDraft.permissionCode}
              onChange={(e) =>
                setActionDraft((d) => ({ ...d, permissionCode: e.target.value }))
              }
              placeholder="WORKSPACE_MANAGEMENT"
              className="w-48"
            />
            <Input
              label="Action code"
              value={actionDraft.actionCode}
              onChange={(e) => setActionDraft((d) => ({ ...d, actionCode: e.target.value }))}
              placeholder="VIEW"
              className="w-32"
            />
            <Button
              variant="primary"
              disabled={
                acting ||
                (!actionDraft.permissionActionId.trim() &&
                  !(actionDraft.permissionCode.trim() && actionDraft.actionCode.trim()))
              }
              onClick={() =>
                void addAction({
                  permissionActionId: actionDraft.permissionActionId.trim() || undefined,
                  permissionCode: actionDraft.permissionCode.trim() || undefined,
                  actionCode: actionDraft.actionCode.trim() || undefined,
                }).then(() =>
                  setActionDraft({ permissionActionId: '', permissionCode: '', actionCode: '' })
                )
              }
              icon={<Plus size={16} />}
            >
              Add action
            </Button>
          </Stack>
        ) : null}
      </div>
      {actions.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-neutral-50 py-10 text-center">
          <Typography tone="muted" variant="small">
            No permission actions attached to this grant.
          </Typography>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Permission</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Legacy right</th>
                <th className="px-4 py-3 font-medium">Attached</th>
                <th className="min-w-[8rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.permissionActionId} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-mono text-xs">{action.permissionCode}</td>
                  <td className="px-4 py-3 font-mono text-xs">{action.actionCode}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {action.legacyRightCode ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                    {formatDate(action.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {grant.status === 'ACTIVE' ? (
                      <Button
                        variant="ghost"
                        tone="error"
                        disabled={acting}
                        onClick={() => void removeAction(action.permissionActionId)}
                        icon={<Trash2 size={16} />}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
