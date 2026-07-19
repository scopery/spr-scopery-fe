'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import type { CreateVendorCostPayload, PhaseFinance } from '../../domain/model/finance'

interface CreateVendorCostModalProps {
  open: boolean
  onClose: () => void
  phases: PhaseFinance[]
  currencyCode: string
  onSubmit: (body: CreateVendorCostPayload) => Promise<void>
}

export function CreateVendorCostModal({
  open,
  onClose,
  phases,
  currencyCode,
  onSubmit,
}: CreateVendorCostModalProps) {
  const [projectPhaseId, setProjectPhaseId] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setProjectPhaseId(phases[0]?.projectPhaseId ?? '')
    setVendorName('')
    setDescription('')
    setAmount('')
  }, [open, phases])

  const canSubmit =
    projectPhaseId &&
    vendorName.trim() &&
    Number.isFinite(Number(amount)) &&
    Number(amount) >= 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        projectPhaseId,
        vendorName: vendorName.trim(),
        description: description.trim() || null,
        amount: Number(amount),
        currencyCode,
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
      title="Add vendor cost"
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
          label="Vendor"
          fullWidth
          required
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
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
      </div>
    </Modal>
  )
}
