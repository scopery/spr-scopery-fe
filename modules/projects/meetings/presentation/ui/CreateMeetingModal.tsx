'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Textarea, Typography } from '@/shared/ui'
import type { CreateMeetingPayload } from '../../domain/model/meeting'

interface CreateMeetingModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateMeetingPayload) => Promise<void>
}

function toIsoOrUndefined(localDateTime: string): string | undefined {
  if (!localDateTime) return undefined
  const d = new Date(localDateTime)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function CreateMeetingModal({ open, onClose, onSubmit }: CreateMeetingModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setStartAt('')
    setEndAt('')
    setLocation('')
    setFormError(null)
  }, [open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const startIso = toIsoOrUndefined(startAt)
    if (!trimmedTitle) {
      setFormError('Title is required')
      return
    }
    if (!startIso) {
      setFormError('Scheduled start is required')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || null,
        startAt: startIso,
        endAt: toIsoOrUndefined(endAt) ?? null,
        location: location.trim() || null,
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
      title="Schedule meeting"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Schedule', onClick: () => void handleSubmit(), variant: 'primary', loading },
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
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Scheduled start"
            type="datetime-local"
            required
            fullWidth
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          <Input
            label="Scheduled end"
            type="datetime-local"
            fullWidth
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>
        <Input
          label="Location / URL"
          fullWidth
          placeholder="Zoom, meeting room, https://…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
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
