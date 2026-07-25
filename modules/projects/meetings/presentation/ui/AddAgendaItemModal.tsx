'use client'

import { useState } from 'react'
import { Input, Modal, Textarea, Typography } from '@/shared/ui'

interface AddAgendaItemModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: {
    title: string
    description?: string | null
    timeboxMinutes?: number | null
  }) => Promise<void>
}

export function AddAgendaItemModal({ open, onClose, onSubmit }: AddAgendaItemModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timebox, setTimebox] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setFormError('Title is required')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      const mins = timebox.trim() ? Number(timebox) : null
      await onSubmit({
        title: trimmed,
        description: description.trim() || null,
        timeboxMinutes: mins != null && !Number.isNaN(mins) ? mins : null,
      })
      setTitle('')
      setDescription('')
      setTimebox('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add agenda item"
      size="md"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        { label: 'Add', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Input
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Review migration blockers"
        />
        <Textarea
          label="Description / expected outcome"
          fullWidth
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should this topic achieve?"
        />
        <Input
          label="Timebox (minutes)"
          type="number"
          fullWidth
          value={timebox}
          onChange={(e) => setTimebox(e.target.value)}
          placeholder="15"
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
