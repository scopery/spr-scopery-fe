'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Select, Textarea, Checkbox, Typography } from '@/shared/ui'
import { ScopeItemPriority, ScopeItemType } from '../../domain/enums/scope.enum'
import type { CreateScopeItemPayload } from '../../domain/model/scope'

interface CreateScopeItemModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateScopeItemPayload) => Promise<void>
}

const TYPE_OPTIONS = [
  { value: ScopeItemType.Functional, label: 'Functional' },
  { value: ScopeItemType.NonFunctional, label: 'Non-functional' },
  { value: ScopeItemType.Technical, label: 'Technical' },
  { value: ScopeItemType.Integration, label: 'Integration' },
  { value: ScopeItemType.Other, label: 'Other' },
]

const PRIORITY_OPTIONS = [
  { value: ScopeItemPriority.Medium, label: 'Medium' },
  { value: ScopeItemPriority.Low, label: 'Low' },
  { value: ScopeItemPriority.High, label: 'High' },
  { value: ScopeItemPriority.Critical, label: 'Critical' },
]

export function CreateScopeItemModal({ open, onClose, onSubmit }: CreateScopeItemModalProps) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<string>(ScopeItemType.Functional)
  const [priority, setPriority] = useState<string>(ScopeItemPriority.Medium)
  const [inScope, setInScope] = useState(true)
  const [acceptanceRequired, setAcceptanceRequired] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setCode('')
    setDescription('')
    setType(ScopeItemType.Functional)
    setPriority(ScopeItemPriority.Medium)
    setInScope(true)
    setAcceptanceRequired(false)
  }, [open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedCode =
      code.trim() ||
      `SI_${trimmedTitle
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
        priority,
        inScope,
        outOfScope: !inScope,
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
      title="Add scope item"
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Typography variant="small" className="mb-1.5">
              Type
            </Typography>
            <Select value={type} onValueChange={setType} options={TYPE_OPTIONS} />
          </div>
          <div>
            <Typography variant="small" className="mb-1.5">
              Priority
            </Typography>
            <Select value={priority} onValueChange={setPriority} options={PRIORITY_OPTIONS} />
          </div>
        </div>
        <Checkbox
          label="In scope"
          checked={inScope}
          onChange={(e) => setInScope(e.target.checked)}
        />
        <Checkbox
          label="Acceptance required"
          checked={acceptanceRequired}
          onChange={(e) => setAcceptanceRequired(e.target.checked)}
        />
      </div>
    </Modal>
  )
}
