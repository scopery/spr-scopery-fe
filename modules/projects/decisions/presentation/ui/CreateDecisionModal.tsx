'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import { DecisionCategory } from '../../domain/enums/decision.enum'
import type { CreateDecisionPayload } from '../../domain/model/decision'

interface CreateDecisionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateDecisionPayload) => Promise<void>
}

const CATEGORY_OPTIONS = [
  { value: DecisionCategory.Technical, label: 'Technical' },
  { value: DecisionCategory.Business, label: 'Business' },
  { value: DecisionCategory.Scope, label: 'Scope' },
  { value: DecisionCategory.Process, label: 'Process' },
  { value: DecisionCategory.Other, label: 'Other' },
]

export function CreateDecisionModal({ open, onClose, onSubmit }: CreateDecisionModalProps) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [rationale, setRationale] = useState('')
  const [category, setCategory] = useState<string>(DecisionCategory.Technical)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setCode('')
    setRationale('')
    setCategory(DecisionCategory.Technical)
  }, [open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedCode =
      code.trim() ||
      `DEC_${trimmedTitle
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .slice(0, 24)}`
    if (!trimmedTitle || !trimmedCode) return
    setLoading(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        code: trimmedCode,
        rationale: rationale.trim() || null,
        category,
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
      title="Add decision"
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
          label="Rationale"
          fullWidth
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
        />
        <div>
          <Typography variant="small" className="mb-1.5">
            Category
          </Typography>
          <Select value={category} onValueChange={setCategory} options={CATEGORY_OPTIONS} />
        </div>
      </div>
    </Modal>
  )
}
