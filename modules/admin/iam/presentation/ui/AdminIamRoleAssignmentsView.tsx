'use client'

import { Ban, Check, Search, UserPlus } from 'lucide-react'

import React from 'react'
import { Typography, Button, Stack, Input, PageSkeleton } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { IamSearchField } from './IamSearchField'
import { useIamRoleAssignments } from '../hooks/useIamRoleAssignments'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'
import { IamEntityIdentityCard } from './IamEntityIdentityCard'

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
    roleIds: [...items.map((item) => item.roleId), ...items.filter((item) => item.assigneeType === 'ROLE').map((item) => item.assigneeId)],
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
        <IamSearchField
          placeholder="Assignee ID"
          value={assigneeId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssigneeId(e.target.value)}
        />
        <IamSearchField
          placeholder="Role ID"
          value={roleId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleId(e.target.value)}
        />
        <Button variant="primary" onClick={() => void refetch()} icon={<Search size={16} />}>
          Search
        </Button>
        <Button variant="neutral-flat" onClick={() => setShowCreate((v) => !v)} icon={!showCreate ? <UserPlus size={16} /> : undefined}>
          {showCreate ? 'Cancel' : 'Assign role'}
        </Button>
      </Stack>

      {showCreate && (
        <div className="mb-6 border border-neutral-200 bg-neutral-50 p-4">
          <Typography as="p" size="sm" weight="medium" className="mb-3">
            Assign role
          </Typography>
          <Stack direction="vertical" spacing="sm" className="max-w-lg">
            <Input
              label="Assignee type"
              value={form.assigneeType}
              onChange={(e) => setForm((f) => ({ ...f, assigneeType: e.target.value }))}
            />
            <Input
              label="Assignee ID"
              value={form.assigneeId}
              onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
            />
            <Input
              label="Role ID"
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
            />
            <Input
              label="Workspace ID (optional)"
              value={form.workspaceId}
              onChange={(e) => setForm((f) => ({ ...f, workspaceId: e.target.value }))}
            />
            <Button variant="primary" disabled={creating} onClick={() => void create()} icon={<UserPlus size={16} />}>
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Workspace</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    {item.assigneeType === 'USER' && usersById[item.assigneeId] ? (
                      <IamEntityIdentityCard
                        title={usersById[item.assigneeId].fullName || usersById[item.assigneeId].username}
                        subtitle={`@${usersById[item.assigneeId].username}`}
                        meta={usersById[item.assigneeId].email}
                        id={item.assigneeId}
                        avatarFallback={usersById[item.assigneeId].fullName || usersById[item.assigneeId].username}
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
                      <IamEntityIdentityCard title={item.assigneeId} subtitle={item.assigneeType} id={item.assigneeId} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rolesById[item.roleId] ? (
                      <IamEntityIdentityCard
                        title={rolesById[item.roleId].name}
                        subtitle={rolesById[item.roleId].code}
                        meta={rolesById[item.roleId].roleScope}
                        id={item.roleId}
                      />
                    ) : (
                      <IamEntityIdentityCard title={item.roleId} id={item.roleId} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.workspaceId ? (
                      workspacesById[item.workspaceId] ? (
                        <IamEntityIdentityCard
                          title={workspacesById[item.workspaceId].name}
                          subtitle={workspacesById[item.workspaceId].code}
                          meta={workspacesById[item.workspaceId].status}
                          id={item.workspaceId}
                        />
                      ) : (
                        <IamEntityIdentityCard title={item.workspaceId} id={item.workspaceId} />
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <IamStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="xs">
                      <Button
                        variant="ghost"
                        disabled={actingId === item.id}
                        onClick={() => void runAction(item.id, 'activate')} icon={<Check size={16} />}>
                        Activate
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={actingId === item.id}
                        onClick={() => void runAction(item.id, 'deactivate')} icon={<Ban size={16} />}>
                        Deactivate
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                    No assignments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
