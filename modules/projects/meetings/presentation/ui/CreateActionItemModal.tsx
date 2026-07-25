'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Textarea, Typography } from '@/shared/ui'
import type { CreateActionItemPayload } from '../../domain/model/meeting-action-item'

interface CreateActionItemModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateActionItemPayload) => Promise<void>
}

export function CreateActionItemModal({ open, onClose, onSubmit }: CreateActionItemModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ownerTargetId, setOwnerTargetId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setOwnerTargetId('')
    setDueDate('')
    setFormError(null)
  }, [open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setFormError('Title is required')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        ownerTargetType: ownerTargetId.trim() ? 'USER' : null,
        ownerTargetId: ownerTargetId.trim() || null,
        dueDate: dueDate || null,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New action item"
      size="md"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        { label: 'Create', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Input
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Input
          label="Owner user id (optional)"
          fullWidth
          placeholder="uuid"
          value={ownerTargetId}
          onChange={(e) => setOwnerTargetId(e.target.value)}
        />
        <Input
          label="Due date"
          type="date"
          fullWidth
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
