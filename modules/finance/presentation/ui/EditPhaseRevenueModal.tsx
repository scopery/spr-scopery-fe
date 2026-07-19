'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Typography } from '@/shared/ui'
import type { PhaseFinance, UpdatePhaseRevenuePayload } from '../../domain/model/finance'

interface EditPhaseRevenueModalProps {
  open: boolean
  onClose: () => void
  phase: PhaseFinance | null
  projectRevenue: number
  onSubmit: (body: UpdatePhaseRevenuePayload) => Promise<void>
}

export function EditPhaseRevenueModal({
  open,
  onClose,
  phase,
  projectRevenue,
  onSubmit,
}: EditPhaseRevenueModalProps) {
  const [plannedRevenue, setPlannedRevenue] = useState('')
  const [revenuePercent, setRevenuePercent] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !phase) return
    setPlannedRevenue(String(phase.plannedRevenue ?? ''))
    setRevenuePercent(String(phase.revenuePercent ?? ''))
  }, [open, phase])

  const handleRevenueChange = (value: string) => {
    setPlannedRevenue(value)
    const n = Number(value)
    if (Number.isFinite(n) && projectRevenue > 0) {
      setRevenuePercent(((n / projectRevenue) * 100).toFixed(2))
    }
  }

  const handlePercentChange = (value: string) => {
    setRevenuePercent(value)
    const n = Number(value)
    if (Number.isFinite(n) && projectRevenue > 0) {
      setPlannedRevenue(((n / 100) * projectRevenue).toFixed(2))
    }
  }

  const handleSubmit = async () => {
    if (!phase) return
    setLoading(true)
    try {
      await onSubmit({
        plannedRevenue: Number(plannedRevenue) || 0,
        revenuePercent: Number(revenuePercent) || 0,
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
      title="Update phase revenue"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Save',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !phase,
        },
      ]}
    >
      {!phase ? null : (
        <div className="space-y-4">
          <Typography variant="small" tone="muted">
            {phase.phaseNameSnapshot} · Project revenue{' '}
            {projectRevenue.toLocaleString()}
          </Typography>
          <Input
            label="Planned revenue"
            type="number"
            fullWidth
            value={plannedRevenue}
            onChange={(e) => handleRevenueChange(e.target.value)}
          />
          <Input
            label="Revenue %"
            type="number"
            fullWidth
            value={revenuePercent}
            onChange={(e) => handlePercentChange(e.target.value)}
          />
        </div>
      )}
    </Modal>
  )
}
