'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, Modal, Select, Typography } from '@/shared/ui'
import { useTaskResourceAssignments } from '../hooks/useTaskResourceAssignments'
import { formatHours } from '../../domain/rules/capacity.rules'

interface TaskResourcesPanelProps {
  workspaceId: string
  projectId: string
  taskId: string
}

export function TaskResourcesPanel({
  workspaceId,
  projectId,
  taskId,
}: TaskResourcesPanelProps) {
  const {
    items,
    roles,
    members,
    loading,
    error,
    saving,
    addAssignment,
    removeAssignment,
    memberLabel,
    roleLabel,
  } = useTaskResourceAssignments(projectId, taskId, workspaceId)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    workspaceMemberId: '',
    roleId: '',
    estimatedHours: '',
  })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Typography weight="semibold">Resources</Typography>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => setOpen(true)}
        >
          Add
        </Button>
      </div>

      {loading ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : error ? (
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      ) : items.length === 0 ? (
        <Typography variant="small" tone="muted">
          No resource assignments
        </Typography>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-2 border border-neutral-100 px-3 py-2"
            >
              <div>
                <Typography variant="small" weight="medium">
                  {memberLabel(a.workspaceMemberId)}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {roleLabel(a.roleId)} · Est {formatHours(a.estimatedHours)} · Actual{' '}
                  {formatHours(a.actualHours)}
                </Typography>
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 size={14} />}
                onClick={() => void removeAssignment(a.id)}
                title="Remove"
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add resource assignment"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setOpen(false), variant: 'ghost' },
          {
            label: 'Add',
            variant: 'primary',
            loading: saving,
            onClick: async () => {
              await addAssignment({
                workspaceMemberId: form.workspaceMemberId,
                roleId: form.roleId || null,
                estimatedHours: form.estimatedHours
                  ? Number(form.estimatedHours)
                  : null,
              })
              setOpen(false)
              setForm({ workspaceMemberId: '', roleId: '', estimatedHours: '' })
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Resource
            </Typography>
            <Select
              value={form.workspaceMemberId}
              onValueChange={(v: string) =>
                setForm((f) => ({ ...f, workspaceMemberId: v }))
              }
              options={members.map((m) => ({
                value: m.id,
                label: memberLabel(m.id),
              }))}
              placeholder="Select member"
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Role
            </Typography>
            <Select
              value={form.roleId}
              onValueChange={(v: string) => setForm((f) => ({ ...f, roleId: v }))}
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
              placeholder="Optional role"
            />
          </div>
          <Input
            label="Estimated hours"
            type="number"
            value={form.estimatedHours}
            onChange={(e) => setForm((f) => ({ ...f, estimatedHours: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
