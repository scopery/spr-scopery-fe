'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Typography } from '@/shared/ui'
import { ProfitRateType } from '../../domain/enums/profitability.enum'
import type { CreateProfitRateCardPayload } from '../../domain/model/profitability'

interface CreateProfitRateCardModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateProfitRateCardPayload) => Promise<void>
  defaultCurrency?: string
}

export function CreateProfitRateCardModal({
  open,
  onClose,
  onSubmit,
  defaultCurrency = 'USD',
}: CreateProfitRateCardModalProps) {
  const [rateCode, setRateCode] = useState('')
  const [name, setName] = useState('')
  const [rateType, setRateType] = useState<string>(ProfitRateType.RoleBased)
  const [roleName, setRoleName] = useState('')
  const [currency, setCurrency] = useState(defaultCurrency)
  const [amountPerHour, setAmountPerHour] = useState('')
  const [amountPerDay, setAmountPerDay] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setRateCode('')
    setName('')
    setRateType(ProfitRateType.RoleBased)
    setRoleName('')
    setCurrency(defaultCurrency)
    setAmountPerHour('')
    setAmountPerDay('')
  }, [open, defaultCurrency])

  const canSubmit =
    rateCode.trim() &&
    name.trim() &&
    Number.isFinite(Number(amountPerHour)) &&
    Number.isFinite(Number(amountPerDay))

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        rateCode: rateCode.trim(),
        name: name.trim(),
        rateType: rateType as CreateProfitRateCardPayload['rateType'],
        roleName: roleName.trim() || null,
        teamId: null,
        currency: currency.trim() || 'USD',
        amountPerHour: Number(amountPerHour),
        amountPerDay: Number(amountPerDay),
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
      title="Add billing rate card"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !canSubmit,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Billing / profit rates (not cost rates). Project cards override workspace defaults.
        </Typography>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Rate code"
            fullWidth
            required
            value={rateCode}
            onChange={(e) => setRateCode(e.target.value)}
            placeholder="RC-SE-USD"
          />
          <Input
            label="Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Rate type
          </Typography>
          <Select
            value={rateType}
            onValueChange={setRateType}
            options={[
              { value: ProfitRateType.RoleBased, label: 'Role-based' },
              { value: ProfitRateType.Individual, label: 'Individual' },
              { value: ProfitRateType.Flat, label: 'Flat' },
            ]}
          />
        </div>
        <Input
          label="Role name"
          fullWidth
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="Senior Engineer"
        />
        <Input
          label="Currency"
          fullWidth
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Amount / hour"
            type="number"
            fullWidth
            required
            value={amountPerHour}
            onChange={(e) => setAmountPerHour(e.target.value)}
          />
          <Input
            label="Amount / day"
            type="number"
            fullWidth
            required
            value={amountPerDay}
            onChange={(e) => setAmountPerDay(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
