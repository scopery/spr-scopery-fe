'use client'

import { Ban, Check, Search, UserPlus } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import { Button, Input, Stack, Typography, Skeleton } from '@/shared/ui'
import { IamStatusBadge } from '../IamStatusBadge'
import { IamSearchField } from '../IamSearchField'
import { iamRoleAssignmentsApi } from '@/modules/auth/iam'
import type { IamRoleAssignment } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

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
      toast.error('Assignee ID and role ID are required')
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
        <IamSearchField
          placeholder="Assignee ID"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        />
        <IamSearchField
          placeholder="Role ID"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        />
        <Button variant="primary" onClick={() => void load()} icon={<Search size={16} />}>
          Search
        </Button>
        <Button variant="neutral-flat" onClick={() => setShowCreate((v) => !v)} icon={!showCreate ? <UserPlus size={16} /> : undefined}>
          {showCreate ? 'Cancel' : 'Assign role'}
        </Button>
      </Stack>
      {showCreate && (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
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
              Assign
            </Button>
          </Stack>
        </div>
      )}
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={80} />
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Assignee</th>
                <th className="px-3 py-2 font-medium">Role ID</th>
                <th className="px-3 py-2 font-medium">Workspace</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="min-w-[12rem] whitespace-nowrap px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">
                    <Typography as="span" variant="small" tone="muted">
                      {item.assigneeType}
                    </Typography>
                    <br />
                    <Typography as="span" variant="small" className="font-mono">
                      {item.assigneeId}
                    </Typography>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{item.roleId}</td>
                  <td className="px-3 py-2 font-mono text-xs">{item.workspaceId ?? '—'}</td>
                  <td className="px-3 py-2">
                    <IamStatusBadge status={item.status} />
                  </td>
                  <td className="px-3 py-2">
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
                  <td colSpan={5} className="px-3 py-6 text-center">
                    <Typography variant="small" tone="muted">
                      No assignments found
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  )
}
