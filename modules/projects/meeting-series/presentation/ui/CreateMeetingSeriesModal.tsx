'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Typography } from '@/shared/ui'
import type { CreateMeetingSeriesPayload } from '../../domain/model/meeting-series'

interface CreateMeetingSeriesModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateMeetingSeriesPayload) => Promise<void>
}

export function CreateMeetingSeriesModal({
  open,
  onClose,
  onSubmit,
}: CreateMeetingSeriesModalProps) {
  const [title, setTitle] = useState('')
  const [recurrenceRule, setRecurrenceRule] = useState('')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setRecurrenceRule('')
    setFormError(null)
  }, [open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedRule = recurrenceRule.trim()
    if (!trimmedTitle) {
      setFormError('Title is required')
      return
    }
    if (!trimmedRule) {
      setFormError('Recurrence rule is required')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      await onSubmit({ title: trimmedTitle, recurrenceRule: trimmedRule })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New meeting series"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
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
        <Input
          label="Recurrence rule"
          required
          fullWidth
          placeholder="e.g. RRULE:FREQ=WEEKLY"
          value={recurrenceRule}
          onChange={(e) => setRecurrenceRule(e.target.value)}
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
