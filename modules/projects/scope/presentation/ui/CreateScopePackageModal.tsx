'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Textarea } from '@/shared/ui'
import type { CreateScopePackagePayload } from '../../domain/model/scope'

interface CreateScopePackageModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateScopePackagePayload) => Promise<void>
}

export function CreateScopePackageModal({
  open,
  onClose,
  onSubmit,
}: CreateScopePackageModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode('')
    setName('')
    setDescription('')
  }, [open])

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    const trimmedCode =
      code.trim() ||
      `SP_${trimmedName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .slice(0, 24)}`
    if (!trimmedName || !trimmedCode) return
    setLoading(true)
    try {
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        description: description.trim() || null,
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
      title="Create scope package"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Create', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Input
          label="Name"
          required
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Auto from name if empty"
        />
        <Textarea
          label="Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  )
}
