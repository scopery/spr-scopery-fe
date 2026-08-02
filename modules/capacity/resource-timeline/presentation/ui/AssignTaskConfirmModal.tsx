'use client'

import { useEffect, useState } from 'react'
import { Modal, Typography } from '@/shared/ui'
import { UserSearchSelect, type PersonIdentity } from '@/modules/platform'
import {
  formatEstimateHours,
  formatTimelineCompactRange,
  type TimelineFlatRow,
} from '@/modules/projects/gantt'

export type AssignTaskConfirmTarget = {
  row: TimelineFlatRow
  projectId: string
  projectName: string | null
}

interface AssignTaskConfirmModalProps {
  open: boolean
  target: AssignTaskConfirmTarget | null
  /** Prefill — usually the person currently filtered in Team schedule. */
  defaultAssigneeUserId: string
  seedPeople: PersonIdentity[]
  submitting?: boolean
  onClose: () => void
  onConfirm: (assigneeUserId: string) => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 text-sm">
      <Typography as="span" variant="small" tone="muted">
        {label}
      </Typography>
      <Typography as="span" variant="small" className="min-w-0 break-words text-neutral-900">
        {value}
      </Typography>
    </div>
  )
}

export function AssignTaskConfirmModal({
  open,
  target,
  defaultAssigneeUserId,
  seedPeople,
  submitting = false,
  onClose,
  onConfirm,
}: AssignTaskConfirmModalProps) {
  const [assigneeUserId, setAssigneeUserId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !target) return
    setAssigneeUserId(defaultAssigneeUserId)
    setFormError(null)
  }, [open, target, defaultAssigneeUserId])

  const row = target?.row
  const title = row?.displayPrimary || row?.title || 'Untitled task'
  const description = row?.displaySecondary?.trim() || null
  const schedule =
    row?.startDate && row?.endDate
      ? formatTimelineCompactRange(row.startDate, row.endDate) || null
      : row && !row.startDate
        ? 'Unscheduled'
        : null
  const estimate = formatEstimateHours(row?.estimateHours ?? null)

  const handleConfirm = () => {
    if (!assigneeUserId) {
      setFormError('Select who should own this task.')
      return
    }
    setFormError(null)
    onConfirm(assigneeUserId)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign task"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost', disabled: submitting },
        {
          label: 'Assign',
          onClick: handleConfirm,
          variant: 'primary',
          loading: submitting,
          disabled: submitting || !target,
        },
      ]}
    >
      <div className="space-y-4">
        <div className="space-y-2 border border-neutral-200 bg-neutral-50 px-3 py-3">
          <Typography as="p" size="sm" weight="medium" className="text-neutral-900">
            {title}
          </Typography>
          {description ? (
            <Typography as="p" variant="small" tone="muted" className="whitespace-pre-wrap">
              {description}
            </Typography>
          ) : (
            <Typography as="p" variant="small" tone="muted">
              No description
            </Typography>
          )}
          <div className="space-y-1.5 border-t border-neutral-200 pt-2">
            {target?.projectName ? (
              <DetailRow label="Project" value={target.projectName} />
            ) : null}
            {schedule ? <DetailRow label="Schedule" value={schedule} /> : null}
            {estimate ? <DetailRow label="Estimate" value={estimate} /> : null}
            {row?.status ? <DetailRow label="Status" value={row.status} /> : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Typography as="p" variant="small" className="text-neutral-800">
            Assign this task to whom?
          </Typography>
          <UserSearchSelect
            label="Assignee"
            value={assigneeUserId}
            onChange={(userId) => {
              setAssigneeUserId(userId)
              if (userId) setFormError(null)
            }}
            seedPeople={seedPeople}
            allowRemoteSearch={false}
            placeholder="Select a person"
            disabled={submitting}
          />
        </div>

        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
