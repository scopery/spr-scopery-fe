'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Textarea } from '@/shared/ui'
import type { CreateProjectPhasePayload } from '../../domain/model/phase'

interface CreatePhaseModalProps {
  open: boolean
  nextDisplayOrder?: number
  onClose: () => void
  onSubmit: (body: CreateProjectPhasePayload) => Promise<void>
}

export function CreatePhaseModal({
  open,
  nextDisplayOrder = 1,
  onClose,
  onSubmit,
}: CreatePhaseModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [plannedStartDate, setPlannedStartDate] = useState('')
  const [plannedEndDate, setPlannedEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setCode('')
    setDescription('')
    setPlannedStartDate('')
    setPlannedEndDate('')
  }, [open])

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    const trimmedCode =
      code.trim() ||
      trimmedName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 16) ||
      `PHASE_${nextDisplayOrder}`

    setLoading(true)
    try {
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        description: description.trim() || null,
        displayOrder: nextDisplayOrder,
        plannedStartDate: plannedStartDate || null,
        plannedEndDate: plannedEndDate || null,
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
      title="Add phase"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create phase',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !name.trim(),
        },
      ]}
    >
      <div className="space-y-3">
        <Input
          label="Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Discovery"
          autoFocus
        />
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Auto from name if empty"
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
            label="Planned start"
            type="date"
            fullWidth
            value={plannedStartDate}
            onChange={(e) => setPlannedStartDate(e.target.value)}
          />
          <Input
            label="Planned end"
            type="date"
            fullWidth
            value={plannedEndDate}
            onChange={(e) => setPlannedEndDate(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
