'use client'

import { Ban, Check, Search, UserPlus } from 'lucide-react'

import { Typography, Button, Stack, PageSkeleton, Select, DataTable } from '@/shared/ui'
import { UserSearchSelect } from '@/modules/platform'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamRoleAssignments } from '../hooks/useIamRoleAssignments'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'
import { IamEntityIdentityCard } from './IamEntityIdentityCard'
import { IamRoleSearchSelect } from './IamRoleSearchSelect'

const ASSIGNEE_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role' },
]

export function AdminIamRoleAssignmentsView() {
  const {
    items,
    loading,
    error,
    assigneeId,
    setAssigneeId,
    roleId,
    setRoleId,
    actingId,
    showCreate,
    setShowCreate,
    form,
    setForm,
    creating,
    refetch,
    runAction,
    create,
  } = useIamRoleAssignments()
  const { usersById, rolesById, workspacesById } = useIamIdentityDirectory({
    userIds: items.filter((item) => item.assigneeType === 'USER').map((item) => item.assigneeId),
    roleIds: [
      ...items.map((item) => item.roleId),
      ...items.filter((item) => item.assigneeType === 'ROLE').map((item) => item.assigneeId),
    ],
    workspaceIds: items.map((item) => item.workspaceId),
  })

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Role assignments
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Assign roles to users and manage assignment lifecycle.
        </Typography>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-6 flex-wrap items-center">
        <div className="min-w-56">
          <UserSearchSelect label="Filter by user" value={assigneeId} onChange={setAssigneeId} />
        </div>
        <div className="min-w-56">
          <IamRoleSearchSelect
            label="Filter by role"
            optional
            value={roleId}
            onChange={setRoleId}
          />
        </div>
        <Button variant="primary" onClick={() => void refetch()} icon={<Search size={16} />}>
          Search
        </Button>
        <Button
          variant="neutral-flat"
          onClick={() => setShowCreate((v) => !v)}
          icon={!showCreate ? <UserPlus size={16} /> : undefined}
        >
          {showCreate ? 'Cancel' : 'Assign role'}
        </Button>
      </Stack>

      {showCreate && (
        <div className="mb-6 border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="medium" className="mb-3">
            Assign role
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-lg">
            <Select
              value={form.assigneeType}
              onValueChange={(assigneeType: string) =>
                setForm((current) => ({ ...current, assigneeType, assigneeId: '' }))
              }
              options={ASSIGNEE_TYPE_OPTIONS}
            />
            {form.assigneeType === 'USER' ? (
              <UserSearchSelect
                label="User"
                value={form.assigneeId}
                onChange={(assigneeId) => setForm((current) => ({ ...current, assigneeId }))}
              />
            ) : (
              <IamRoleSearchSelect
                label="Assignee role"
                value={form.assigneeId}
                onChange={(assigneeId) => setForm((current) => ({ ...current, assigneeId }))}
              />
            )}
            <IamRoleSearchSelect
              value={form.roleId}
              onChange={(roleId) => setForm((current) => ({ ...current, roleId }))}
            />
            <AdminWorkspaceSearchSelect
              optional
              value={form.workspaceId}
              onChange={(workspaceId) => setForm((current) => ({ ...current, workspaceId }))}
            />
            <Button
              variant="primary"
              disabled={creating}
              onClick={() => void create()}
              icon={<UserPlus size={16} />}
            >
              {creating ? 'Assigning…' : 'Assign'}
            </Button>
          </Stack>
        </div>
      )}

      {loading ? (
        <PageSkeleton variant="list" />
      ) : error ? (
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <DataTable
            ariaLabel="Admin Iam Role Assignments"
            rows={items}
            rowKey={(item) => String(item.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'assignee',
                header: 'Assignee',
                cell: (item) => (
                  <>
                    {item.assigneeType === 'USER' && usersById[item.assigneeId] ? (
                      <IamEntityIdentityCard
                        title={
                          usersById[item.assigneeId].fullName || usersById[item.assigneeId].username
                        }
                        subtitle={`@${usersById[item.assigneeId].username}`}
                        meta={usersById[item.assigneeId].email}
                        id={item.assigneeId}
                        avatarFallback={
                          usersById[item.assigneeId].fullName || usersById[item.assigneeId].username
                        }
                        badge={item.assigneeType}
                      />
                    ) : item.assigneeType === 'ROLE' && rolesById[item.assigneeId] ? (
                      <IamEntityIdentityCard
                        title={rolesById[item.assigneeId].name}
                        subtitle={rolesById[item.assigneeId].code}
                        meta={rolesById[item.assigneeId].roleScope}
                        id={item.assigneeId}
                        badge={item.assigneeType}
                      />
                    ) : (
                      <IamEntityIdentityCard
                        title="—"
                        subtitle={item.assigneeType}
                        id={item.assigneeId}
                      />
                    )}
                  </>
                ),
              },
              {
                id: 'role',
                header: 'Role',
                cell: (item) => (
                  <>
                    {rolesById[item.roleId] ? (
                      <IamEntityIdentityCard
                        title={rolesById[item.roleId].name}
                        subtitle={rolesById[item.roleId].code}
                        meta={rolesById[item.roleId].roleScope}
                        id={item.roleId}
                      />
                    ) : (
                      <IamEntityIdentityCard title="—" id={item.roleId} />
                    )}
                  </>
                ),
              },
              {
                id: 'workspace',
                header: 'Workspace',
                cell: (item) => (
                  <>
                    {item.workspaceId ? (
                      workspacesById[item.workspaceId] ? (
                        <IamEntityIdentityCard
                          title={workspacesById[item.workspaceId].name}
                          subtitle={workspacesById[item.workspaceId].code}
                          meta={workspacesById[item.workspaceId].status}
                          id={item.workspaceId}
                        />
                      ) : (
                        <IamEntityIdentityCard title="—" id={item.workspaceId} />
                      )
                    ) : (
                      '—'
                    )}
                  </>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (item) => (
                  <>
                    <IamStatusBadge status={item.status} />
                  </>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (item) => (
                  <>
                    <Stack direction="horizontal" spacing="xs">
                      <Button
                        variant="ghost"
                        disabled={actingId === item.id}
                        onClick={() => void runAction(item.id, 'activate')}
                        icon={<Check size={16} />}
                      >
                        Activate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === item.id}
                        onClick={() => void runAction(item.id, 'deactivate')}
                        icon={<Ban size={16} />}
                      >
                        Deactivate
                      </Button>
                    </Stack>
                  </>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
