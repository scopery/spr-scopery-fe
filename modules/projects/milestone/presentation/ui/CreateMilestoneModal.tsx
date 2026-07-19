'use client'

import { useState } from 'react'
import { Button, Input, Modal, Stack, Textarea } from '@/shared/ui'
import type { CreateMilestonePayload } from '../../domain/model/milestone'

interface CreateMilestoneModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateMilestonePayload) => Promise<void>
}

export function CreateMilestoneModal({ open, onClose, onSubmit }: CreateMilestoneModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim(),
        targetDate: targetDate || null,
        notes: notes.trim() || null,
      })
      setName('')
      setCode('')
      setTargetDate('')
      setNotes('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New milestone">
      <Stack direction="vertical" spacing="md">
        <Input
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Milestone name"
        />
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. MS-01"
        />
        <Input
          label="Target date"
          type="date"
          fullWidth
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
        <Textarea
          label="Notes (optional)"
          fullWidth
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Stack direction="horizontal" spacing="sm" className="justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={() => void handleSubmit()}>
            Create
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
