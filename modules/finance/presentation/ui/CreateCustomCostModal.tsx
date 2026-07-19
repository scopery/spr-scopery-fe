'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import type { CreateCustomCostPayload, PhaseFinance } from '../../domain/model/finance'

interface CreateCustomCostModalProps {
  open: boolean
  onClose: () => void
  phases: PhaseFinance[]
  currencyCode: string
  onSubmit: (body: CreateCustomCostPayload) => Promise<void>
}

export function CreateCustomCostModal({
  open,
  onClose,
  phases,
  currencyCode,
  onSubmit,
}: CreateCustomCostModalProps) {
  const [projectPhaseId, setProjectPhaseId] = useState('')
  const [category, setCategory] = useState('TRAVEL')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [costDate, setCostDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setProjectPhaseId(phases[0]?.projectPhaseId ?? '')
    setCategory('TRAVEL')
    setName('')
    setDescription('')
    setAmount('')
    setCostDate('')
  }, [open, phases])

  const canSubmit =
    projectPhaseId && name.trim() && Number.isFinite(Number(amount)) && Number(amount) >= 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        projectPhaseId,
        category: category.trim() || 'OTHER',
        name: name.trim(),
        description: description.trim() || null,
        amount: Number(amount),
        currencyCode,
        costDate: costDate || null,
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
      title="Add custom cost"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Add',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !canSubmit,
        },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Phase
          </Typography>
          <Select
            value={projectPhaseId}
            onValueChange={setProjectPhaseId}
            options={phases.map((p) => ({
              value: p.projectPhaseId,
              label: p.phaseNameSnapshot,
            }))}
          />
        </div>
        <Input
          label="Category"
          fullWidth
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          label="Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Description
          </Typography>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <Input
          label={`Amount (${currencyCode})`}
          type="number"
          fullWidth
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          label="Cost date"
          type="date"
          fullWidth
          value={costDate}
          onChange={(e) => setCostDate(e.target.value)}
        />
      </div>
    </Modal>
  )
}
