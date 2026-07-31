'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Archive, Plus, Users } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
import { listWorkspaceMembers } from '@/modules/org/workspace'
import { PersonReferenceSelect, useResolveUsers } from '@/modules/platform'
import { useResourceProfiles } from '../hooks/useResourceProfiles'
import { ResourceProfileStatus, ResourceType } from '../../domain/enums/capacity.enum'

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All types' },
  { value: ResourceType.InternalUser, label: 'Internal user' },
  { value: ResourceType.ExternalContractor, label: 'External contractor' },
  { value: ResourceType.VendorStaff, label: 'Vendor staff' },
  { value: ResourceType.PlaceholderRole, label: 'Placeholder role' },
  { value: ResourceType.Team, label: 'Team' },
]

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  { value: ResourceProfileStatus.Active, label: 'Active' },
  { value: ResourceProfileStatus.Archived, label: 'Archived' },
]

const CREATE_TYPE_OPTIONS = TYPE_OPTIONS.filter((o) => o.value !== 'ALL')

function emptyCreateForm() {
  return {
    resourceType: ResourceType.InternalUser as string,
    displayName: '',
    linkedWorkspaceMemberId: '',
    linkedUserId: '',
    primaryRoleId: '',
  }
}

export function ResourcesProfilesView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    items,
    roles,
    selected,
    selectedId,
    setSelectedId,
    loading,
    error,
    creating,
    syncing,
    lastSync,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    keyword,
    setKeyword,
    createResource,
    archiveResource,
    syncFromMembers,
    roleName,
    canArchive,
  } = useResourceProfiles(workspaceId)

  const [showCreate, setShowCreate] = useState(false)
  const [showSync, setShowSync] = useState(false)
  const [members, setMembers] = useState<{ id: string; userId: string }[]>([])
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { personFor } = useResolveUsers(memberUserIds)
  const memberOptions = useMemo(
    () =>
      members.flatMap((member) => {
        const person = personFor(member.userId)
        return person ? [{ value: member.id, person }] : []
      }),
    [members, personFor]
  )
  const [form, setForm] = useState(emptyCreateForm)

  const loadMembers = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await listWorkspaceMembers(workspaceId, {
        page: 0,
        size: 100,
      })
      setMembers(res.items.map((m) => ({ id: m.id, userId: m.userId })))
    } catch {
      setMembers([])
    }
  }, [workspaceId])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  if (loading && items.length === 0) return <PageSkeleton variant="split" />
  if (error) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Resources & Profiles
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Workspace resource pool. Profiles support create and archive only (no update in
            contract).
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button variant="secondary" icon={<Users size={16} />} onClick={() => setShowSync(true)}>
            Sync from members
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
            Create resource
          </Button>
        </div>
      </div>

      {lastSync ? (
        <div className="mb-4 border border-neutral-200 bg-neutral-50 px-4 py-3">
          <Typography variant="small">
            Last sync: {lastSync.createdCount} created · {lastSync.skippedCount} skipped ·{' '}
            {lastSync.errorCount} errors
          </Typography>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-sm">
        <div className="w-40">
          <Select
            value={typeFilter}
            onValueChange={(v: string) => setTypeFilter(v)}
            options={TYPE_OPTIONS}
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onValueChange={(v: string) => setStatusFilter(v)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <Input
            placeholder="Search by name"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-md lg:grid-cols-[1.4fr_1fr]">
        <Card className="border border-neutral-200 bg-white">
          <DataTable
            ariaLabel="Resource profiles"
            rows={items}
            rowKey={(resource) => resource.id}
            emptyMessage="No resources match these filters."
            selectedRowKey={selectedId}
            onRowClick={(resource) => setSelectedId(resource.id)}
            columns={[
              { id: 'resource', header: 'Resource', accessor: (r) => r.displayName || '—' },
              {
                id: 'type',
                header: 'Type',
                cell: (r) => (
                  <Badge
                    size="sm"
                    tone={r.resourceType === ResourceType.PlaceholderRole ? 'warning' : 'neutral'}
                  >
                    {r.resourceType}
                  </Badge>
                ),
              },
              {
                id: 'role',
                header: 'Role',
                accessor: (r) => {
                  const label = roleName(r.primaryRoleId)
                  return r.primaryRoleId && label === r.primaryRoleId.slice(0, 8) ? '—' : label
                },
                kind: 'reference',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (r) => (
                  <Badge
                    size="sm"
                    tone={r.status === ResourceProfileStatus.Active ? 'success' : 'neutral'}
                  >
                    {r.status}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>

        <Card as="aside" className="border border-neutral-200 bg-white p-md">
          {!selected ? (
            <Typography tone="muted" variant="small">
              Select a resource to inspect.
            </Typography>
          ) : (
            <div className="flex flex-col gap-md">
              <div>
                <Typography weight="semibold">{selected.displayName}</Typography>
                <div className="mt-1 flex flex-wrap gap-xs">
                  <Badge size="sm" tone="neutral">
                    {selected.resourceType}
                  </Badge>
                  <Badge
                    size="sm"
                    tone={selected.status === ResourceProfileStatus.Active ? 'success' : 'neutral'}
                  >
                    {selected.status}
                  </Badge>
                </div>
              </div>
              <dl className="grid gap-sm text-sm">
                <div>
                  <Typography variant="caption" tone="muted">
                    Primary role
                  </Typography>
                  <Typography variant="small">{roleName(selected.primaryRoleId)}</Typography>
                </div>
                <div>
                  <Typography variant="caption" tone="muted">
                    Linked member
                  </Typography>
                  <Typography variant="small">
                    {memberOptions.find(
                      (member) => member.value === selected.linkedWorkspaceMemberId
                    )?.person.fullName ?? '—'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" tone="muted">
                    Linked user
                  </Typography>
                  <Typography variant="small">
                    {selected.linkedUserId
                      ? (personFor(selected.linkedUserId)?.fullName ?? '—')
                      : '—'}
                  </Typography>
                </div>
              </dl>
              <Typography variant="caption" tone="muted">
                Capacity profile, availability, allocations, and risks open from detail tabs once
                wired in later slices. Edit is unavailable until BE adds update.
              </Typography>
              {canArchive(selected) ? (
                <Button
                  variant="ghost"
                  icon={<Archive size={14} />}
                  onClick={() => void archiveResource(selected.id)}
                >
                  Archive resource
                </Button>
              ) : null}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create resource"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowCreate(false), variant: 'ghost' },
          {
            label: 'Create',
            variant: 'primary',
            loading: creating,
            onClick: async () => {
              const member = members.find((m) => m.id === form.linkedWorkspaceMemberId)
              await createResource({
                resourceType: form.resourceType as ResourceType,
                displayName: form.displayName.trim(),
                linkedUserId:
                  form.resourceType === ResourceType.InternalUser
                    ? (member?.userId ?? form.linkedUserId) || null
                    : null,
                linkedWorkspaceMemberId:
                  form.resourceType === ResourceType.InternalUser
                    ? form.linkedWorkspaceMemberId || null
                    : null,
                primaryRoleId: form.primaryRoleId || null,
              })
              setShowCreate(false)
              setForm(emptyCreateForm())
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Type
            </Typography>
            <Select
              value={form.resourceType}
              onValueChange={(v: string) => setForm((f) => ({ ...f, resourceType: v }))}
              options={CREATE_TYPE_OPTIONS}
            />
          </div>
          <Input
            label="Display name"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          />
          {form.resourceType === ResourceType.InternalUser ? (
            <PersonReferenceSelect
              label="Linked member"
              value={form.linkedWorkspaceMemberId}
              onChange={(v: string) => {
                const member = members.find((m) => m.id === v)
                setForm((f) => ({
                  ...f,
                  linkedWorkspaceMemberId: v,
                  linkedUserId: member?.userId ?? '',
                }))
              }}
              options={memberOptions}
              placeholder="Select member"
            />
          ) : null}
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Primary role (optional)
            </Typography>
            <Select
              value={form.primaryRoleId}
              onValueChange={(v: string) => setForm((f) => ({ ...f, primaryRoleId: v }))}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Select role"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={showSync}
        onClose={() => setShowSync(false)}
        title="Sync from workspace members"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setShowSync(false), variant: 'ghost' },
          {
            label: 'Sync',
            variant: 'primary',
            loading: syncing,
            onClick: async () => {
              await syncFromMembers()
              setShowSync(false)
            },
          },
        ]}
      >
        <Typography variant="small">
          Creates resource profiles for workspace members that do not already have one. You will see
          created / skipped / error counts after the sync completes.
        </Typography>
      </Modal>
    </div>
  )
}
