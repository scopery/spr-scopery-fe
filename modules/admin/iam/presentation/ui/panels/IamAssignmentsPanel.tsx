'use client'

import { Ban, Check, Search, UserPlus } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Select, Stack, Typography, Skeleton, DataTable } from '@/shared/ui'
import { UserSearchSelect } from '@/modules/platform'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'
import { IamStatusBadge } from '../IamStatusBadge'
import { iamRoleAssignmentsApi } from '@/modules/auth/iam'
import type { IamRoleAssignment } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { IamRoleSearchSelect } from '../IamRoleSearchSelect'
import { useIamIdentityDirectory } from '../../hooks/useIamIdentityDirectory'

const ASSIGNEE_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role' },
]

export function IamAssignmentsPanel() {
  const [assigneeId, setAssigneeId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [items, setItems] = useState<IamRoleAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    assigneeType: 'USER',
    assigneeId: '',
    roleId: '',
    workspaceId: '',
  })
  const [creating, setCreating] = useState(false)
  const { usersById, rolesById, workspacesById } = useIamIdentityDirectory({
    userIds: items.filter((item) => item.assigneeType === 'USER').map((item) => item.assigneeId),
    roleIds: [
      ...items.map((item) => item.roleId),
      ...items.filter((item) => item.assigneeType === 'ROLE').map((item) => item.assigneeId),
    ],
    workspaceIds: items.map((item) => item.workspaceId),
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await iamRoleAssignmentsApi.searchRoleAssignments({
        assigneeId: assigneeId.trim() || undefined,
        roleId: roleId.trim() || undefined,
        page: 0,
        size: 50,
      })
      setItems(res.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [assigneeId, roleId])

  useEffect(() => {
    void load()
  }, [load])

  const runAction = async (id: string, action: 'activate' | 'deactivate') => {
    setActingId(id)
    try {
      if (action === 'activate') await iamRoleAssignmentsApi.activateRoleAssignment(id)
      else await iamRoleAssignmentsApi.deactivateRoleAssignment(id)
      toast.success('Assignment updated')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActingId(null)
    }
  }

  const create = async () => {
    if (!form.assigneeId.trim() || !form.roleId.trim()) {
      toast.error('Assignee and role are required')
      return
    }
    setCreating(true)
    try {
      await iamRoleAssignmentsApi.createRoleAssignment({
        assigneeType: form.assigneeType,
        assigneeId: form.assigneeId.trim(),
        roleId: form.roleId.trim(),
        workspaceId: form.workspaceId.trim() || undefined,
      })
      toast.success('Role assigned')
      setShowCreate(false)
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Stack direction="vertical" spacing="md">
      <Stack direction="horizontal" spacing="sm" className="flex-wrap items-center">
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
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
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
        <div className="border border-neutral-200 bg-neutral-50 p-4">
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
              Assign
            </Button>
          </Stack>
        </div>
      )}
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={80} />
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <DataTable
            ariaLabel="Iam Assignments Panel"
            rows={items}
            rowKey={(item) => String(item.id)}
            emptyMessage="No items."
            columns={[
              {
                id: 'assignee',
                header: 'Assignee',
                accessor: (item) => {
                  if (item.assigneeType === 'USER') {
                    const user = usersById[item.assigneeId]
                    return user?.fullName || user?.username || user?.email || '—'
                  }
                  if (item.assigneeType === 'ROLE') {
                    return rolesById[item.assigneeId]?.name ?? '—'
                  }
                  return '—'
                },
                kind: 'reference',
              },
              {
                id: 'role',
                header: 'Role',
                accessor: (item) =>
                  rolesById[item.roleId]?.name ?? rolesById[item.roleId]?.code ?? '—',
                kind: 'reference',
              },
              {
                id: 'workspace',
                header: 'Workspace',
                accessor: (item) =>
                  item.workspaceId
                    ? (workspacesById[item.workspaceId]?.name ??
                      workspacesById[item.workspaceId]?.code ??
                      '—')
                    : 'System',
                kind: 'reference',
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
    </Stack>
  )
}
