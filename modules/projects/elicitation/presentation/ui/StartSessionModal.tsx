'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Select, Typography } from '@/shared/ui'
import type { ScopePackage } from '@/modules/projects/scope/domain/model/scope'

interface StartSessionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { scopePackageId: string; title?: string }) => Promise<void>
  scopePackages: ScopePackage[]
}

export function StartSessionModal({
  open,
  onClose,
  onSubmit,
  scopePackages,
}: StartSessionModalProps) {
  const [scopePackageId, setScopePackageId] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setScopePackageId(scopePackages[0]?.id ?? '')
    setTitle('')
  }, [open, scopePackages])

  const handleSubmit = async () => {
    if (!scopePackageId) return
    setLoading(true)
    try {
      await onSubmit({ scopePackageId, title: title.trim() || undefined })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const packageOptions = scopePackages.map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start elicitation session"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Start session',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !scopePackageId,
        },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Typography variant="caption" className="block mb-1 font-medium text-neutral-700">
            Scope package <span className="text-red-500">*</span>
          </Typography>
          <Select
            value={scopePackageId}
            onValueChange={setScopePackageId}
            options={packageOptions}
            className="w-full"
          />
        </div>
        <Input
          label="Session title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Optional — e.g. Sprint 3 Elicitation"
        />
      </div>
    </Modal>
  )
}
