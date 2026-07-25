'use client'

import { useState } from 'react'
import { Input, Modal, Select, Typography } from '@/shared/ui'
import type { AddParticipantPayload } from '../../domain/model/meeting'

interface AddParticipantModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: AddParticipantPayload) => Promise<void>
}

const ROLE_OPTIONS = [
  { value: 'ATTENDEE', label: 'Required / Attendee' },
  { value: 'OPTIONAL', label: 'Optional' },
  { value: 'PRESENTER', label: 'Presenter' },
  { value: 'ORGANIZER', label: 'Organizer' },
]

export function AddParticipantModal({ open, onClose, onSubmit }: AddParticipantModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [targetId, setTargetId] = useState('')
  const [role, setRole] = useState('ATTENDEE')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const name = displayName.trim()
    if (!name && !targetId.trim()) {
      setFormError('Display name or user id is required')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      await onSubmit({
        targetType: 'USER',
        targetId: targetId.trim() || crypto.randomUUID(),
        displayName: name || null,
        email: email.trim() || null,
        participantRole: role,
      })
      setDisplayName('')
      setEmail('')
      setTargetId('')
      setRole('ATTENDEE')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add participant"
      size="md"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        { label: 'Add', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Input
          label="Display name"
          fullWidth
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Linh Nguyen"
        />
        <Input
          label="Email (optional)"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="linh@example.com"
        />
        <Input
          label="User id (optional)"
          fullWidth
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="uuid — leave blank to invite by name"
        />
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Role
          </Typography>
          <Select value={role} onValueChange={setRole} options={ROLE_OPTIONS} />
        </div>
        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}
        <Typography variant="small" tone="muted">
          Member picker will replace free-text user id when the directory search API is available.
        </Typography>
      </div>
    </Modal>
  )
}
