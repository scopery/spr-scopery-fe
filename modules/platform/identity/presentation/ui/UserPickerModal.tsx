'use client'

import { useEffect, useState } from 'react'
import { Modal, Typography } from '@/shared/ui'
import { UserSearchSelect } from './UserSearchSelect'
import type { PersonIdentity } from '../../domain/model/person-identity'

export interface UserPickerModalProps {
  open: boolean
  value?: string | null
  targetLabel?: string
  targetCount?: number
  saving?: boolean
  allowClear?: boolean
  seedPeople?: PersonIdentity[]
  allowRemoteSearch?: boolean
  onClose: () => void
  onSave: (userId: string | null) => Promise<void> | void
}

/**
 * Common single-user picker dialog.
 *
 * Search and selected states consistently render avatar, display name, and email
 * through UserSearchSelect/UserIdentity. Suitable for assignee, owner, reviewer,
 * approver, or any other single-user relation.
 */
export function UserPickerModal({
  open,
  value,
  targetLabel = 'item',
  targetCount = 1,
  saving = false,
  allowClear = true,
  seedPeople = [],
  allowRemoteSearch = true,
  onClose,
  onSave,
}: UserPickerModalProps) {
  const [selectedId, setSelectedId] = useState(value ?? '')

  useEffect(() => {
    if (open) setSelectedId(value ?? '')
  }, [open, value])

  const pluralTarget = targetCount === 1 ? targetLabel : `${targetLabel}s`

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={targetCount === 1 ? `Select ${targetLabel}` : `Select user for ${targetCount} items`}
      size="md"
      actions={[
        { label: 'Cancel', variant: 'ghost', onClick: onClose },
        {
          label: selectedId ? 'Save user' : 'Clear user',
          variant: 'primary',
          disabled: saving || (!allowClear && !selectedId),
          loading: saving,
          onClick: () => void onSave(selectedId || null),
        },
      ]}
    >
      <div className="space-y-md">
        <Typography variant="small" tone="muted">
          Search by name or email. Saving applies this user to {targetCount} {pluralTarget}.
        </Typography>
        <UserSearchSelect
          value={selectedId}
          placeholder="Search user…"
          onChange={setSelectedId}
          disabled={saving}
          seedPeople={seedPeople}
          allowRemoteSearch={allowRemoteSearch}
        />
      </div>
    </Modal>
  )
}
