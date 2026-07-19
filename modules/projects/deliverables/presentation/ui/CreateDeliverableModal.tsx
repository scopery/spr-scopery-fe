'use client'

import { useEffect, useState } from 'react'
import { Checkbox, Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import type { CreateDeliverablePayload } from '../../domain/model/deliverable'

interface CreateDeliverableModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateDeliverablePayload) => Promise<void>
}

const TYPE_OPTIONS = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'SOFTWARE', label: 'Software' },
  { value: 'REPORT', label: 'Report' },
  { value: 'OTHER', label: 'Other' },
]

export function CreateDeliverableModal({ open, onClose, onSubmit }: CreateDeliverableModalProps) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<string>('DOCUMENT')
  const [acceptanceRequired, setAcceptanceRequired] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setCode('')
    setDescription('')
    setType('DOCUMENT')
    setAcceptanceRequired(true)
  }, [open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedCode =
      code.trim() ||
      `DLV_${trimmedTitle
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .slice(0, 24)}`
    if (!trimmedTitle || !trimmedCode) return
    setLoading(true)
    try {
      await onSubmit({
        type,
        code: trimmedCode,
        title: trimmedTitle,
        description: description.trim() || null,
        acceptanceRequired,
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
      title="Add deliverable"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
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
        />
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Auto from title if empty"
        />
        <Textarea
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div>
          <Typography variant="small" className="mb-1.5">
            Type
          </Typography>
          <Select value={type} onValueChange={setType} options={TYPE_OPTIONS} />
        </div>
        <Checkbox
          label="Acceptance required"
          checked={acceptanceRequired}
          onChange={(e) => setAcceptanceRequired(e.target.checked)}
        />
      </div>
    </Modal>
  )
}
