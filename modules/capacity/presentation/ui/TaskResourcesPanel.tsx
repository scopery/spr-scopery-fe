'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, Modal, Select, Typography } from '@/shared/ui'
import { useTaskResourceAssignments } from '../hooks/useTaskResourceAssignments'
import { TaskAssignmentType } from '../../domain/enums/capacity.enum'
import { formatHours } from '../../domain/rules/capacity.rules'

interface TaskResourcesPanelProps {
  workspaceId: string
  projectId: string
  taskId: string
}

const ASSIGNMENT_TYPE_OPTIONS = [
  { value: TaskAssignmentType.Owner, label: 'Owner' },
  { value: TaskAssignmentType.Primary, label: 'Primary' },
  { value: TaskAssignmentType.Support, label: 'Support' },
  { value: TaskAssignmentType.Reviewer, label: 'Reviewer' },
  { value: TaskAssignmentType.Qa, label: 'QA' },
  { value: TaskAssignmentType.ApproverLabelOnly, label: 'Approver (label only)' },
]

function emptyForm() {
  return {
    resourceProfileId: '',
    assignmentType: TaskAssignmentType.Primary as string,
    plannedEffortHours: '',
  }
}

export function TaskResourcesPanel({
  workspaceId,
  projectId,
  taskId,
}: TaskResourcesPanelProps) {
  const {
    items,
    profiles,
    loading,
    error,
    saving,
    addAssignment,
    removeAssignment,
    profileLabel,
  } = useTaskResourceAssignments(projectId, taskId, workspaceId)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

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
                  {profileLabel(a.resourceProfileId)}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {a.assignmentType} · Planned {formatHours(a.plannedEffortHours)}
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
            disabled: !form.resourceProfileId || !form.assignmentType,
            onClick: async () => {
              await addAssignment({
                resourceProfileId: form.resourceProfileId,
                assignmentType: form.assignmentType,
                plannedEffortHours: form.plannedEffortHours
                  ? Number(form.plannedEffortHours)
                  : null,
              })
              setOpen(false)
              setForm(emptyForm())
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          {profiles.length === 0 ? (
            <Typography variant="small" tone="muted">
              No active resource profiles in this workspace. Create one under Capacity →
              Resources & Profiles (or Sync from members), then try again.
            </Typography>
          ) : null}
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Resource profile
            </Typography>
            <Select
              value={form.resourceProfileId}
              onValueChange={(v: string) =>
                setForm((f) => ({ ...f, resourceProfileId: v }))
              }
              options={profiles.map((p) => ({
                value: p.id,
                label: `${p.displayName} (${p.resourceType})`,
              }))}
              placeholder="Select resource"
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Assignment type
            </Typography>
            <Select
              value={form.assignmentType}
              onValueChange={(v: string) =>
                setForm((f) => ({ ...f, assignmentType: v }))
              }
              options={ASSIGNMENT_TYPE_OPTIONS}
            />
          </div>
          <Input
            label="Planned effort (hours)"
            type="number"
            value={form.plannedEffortHours}
            onChange={(e) =>
              setForm((f) => ({ ...f, plannedEffortHours: e.target.value }))
            }
          />
        </div>
      </Modal>
    </div>
  )
}
