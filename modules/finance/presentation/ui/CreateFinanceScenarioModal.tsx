'use client'

import { useEffect, useState } from 'react'
import { Checkbox, Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import {
  CostAdjustmentMethod,
  RevenueSplitMethod,
} from '../../domain/enums/finance.enum'
import type { CreateFinanceScenarioPayload } from '../../domain/model/finance'

interface EstimationRunOption {
  id: string
  label: string
}

interface CreateFinanceScenarioModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateFinanceScenarioPayload) => Promise<void>
  estimationRuns: EstimationRunOption[]
  defaultCurrency?: string
}

export function CreateFinanceScenarioModal({
  open,
  onClose,
  onSubmit,
  estimationRuns,
  defaultCurrency = 'USD',
}: CreateFinanceScenarioModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [estimationRunId, setEstimationRunId] = useState('')
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency)
  const [plannedRevenue, setPlannedRevenue] = useState('')
  const [revenueSplitMethod, setRevenueSplitMethod] = useState<string>(
    RevenueSplitMethod.EqualSplit
  )
  const [contingencyMethod, setContingencyMethod] = useState<string>(
    CostAdjustmentMethod.Percent
  )
  const [contingencyPercent, setContingencyPercent] = useState('10')
  const [overheadMethod, setOverheadMethod] = useState<string>(CostAdjustmentMethod.Percent)
  const [overheadPercent, setOverheadPercent] = useState('15')
  const [targetMarginPercent, setTargetMarginPercent] = useState('30')
  const [assumptions, setAssumptions] = useState('')
  const [markAsCurrent, setMarkAsCurrent] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setCode('')
    setDescription('')
    setEstimationRunId(estimationRuns[0]?.id ?? '')
    setCurrencyCode(defaultCurrency)
    setPlannedRevenue('')
    setRevenueSplitMethod(RevenueSplitMethod.EqualSplit)
    setContingencyMethod(CostAdjustmentMethod.Percent)
    setContingencyPercent('10')
    setOverheadMethod(CostAdjustmentMethod.Percent)
    setOverheadPercent('15')
    setTargetMarginPercent('30')
    setAssumptions('')
    setMarkAsCurrent(true)
  }, [open, estimationRuns, defaultCurrency])

  const revenue = Number(plannedRevenue)
  const canSubmit =
    name.trim().length > 0 &&
    code.trim().length > 0 &&
    estimationRunId.length > 0 &&
    Number.isFinite(revenue) &&
    revenue >= 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || null,
        estimationRunId,
        currencyCode: currencyCode.trim() || 'USD',
        plannedRevenue: revenue,
        revenueSplitMethod: revenueSplitMethod as CreateFinanceScenarioPayload['revenueSplitMethod'],
        contingency: {
          method: contingencyMethod as CreateFinanceScenarioPayload['contingency']['method'],
          percent:
            contingencyMethod === CostAdjustmentMethod.Percent
              ? Number(contingencyPercent) || 0
              : null,
          fixedAmount: null,
        },
        overhead: {
          method: overheadMethod as CreateFinanceScenarioPayload['overhead']['method'],
          percent:
            overheadMethod === CostAdjustmentMethod.Percent
              ? Number(overheadPercent) || 0
              : null,
          fixedAmount: null,
        },
        targetMarginPercent: Number(targetMarginPercent) || null,
        assumptionsJson: assumptions.trim() ? { notes: assumptions.trim() } : null,
        markAsCurrent,
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
      title="Create finance scenario"
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create scenario',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !canSubmit,
        },
      ]}
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Base Case Q3 2026"
          />
          <Input
            label="Code"
            fullWidth
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="FS-2026-Q3-BASE"
          />
        </div>
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
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Estimation run
          </Typography>
          <Select
            value={estimationRunId}
            onValueChange={setEstimationRunId}
            options={estimationRuns.map((r) => ({ value: r.id, label: r.label }))}
            placeholder={
              estimationRuns.length === 0
                ? 'No estimation runs available'
                : 'Select estimation run'
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Currency"
            fullWidth
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
          />
          <Input
            label="Planned revenue"
            type="number"
            fullWidth
            required
            value={plannedRevenue}
            onChange={(e) => setPlannedRevenue(e.target.value)}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Revenue split
          </Typography>
          <Select
            value={revenueSplitMethod}
            onValueChange={setRevenueSplitMethod}
            options={[
              { value: RevenueSplitMethod.EqualSplit, label: 'Equal split' },
              { value: RevenueSplitMethod.EffortBased, label: 'Effort-based' },
              { value: RevenueSplitMethod.Manual, label: 'Manual' },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Contingency
            </Typography>
            <Select
              value={contingencyMethod}
              onValueChange={setContingencyMethod}
              options={[
                { value: CostAdjustmentMethod.Percent, label: 'Percent' },
                { value: CostAdjustmentMethod.None, label: 'None' },
                { value: CostAdjustmentMethod.FixedAmount, label: 'Fixed amount' },
              ]}
            />
            {contingencyMethod === CostAdjustmentMethod.Percent ? (
              <Input
                className="mt-2"
                label="Contingency %"
                type="number"
                fullWidth
                value={contingencyPercent}
                onChange={(e) => setContingencyPercent(e.target.value)}
              />
            ) : null}
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Overhead
            </Typography>
            <Select
              value={overheadMethod}
              onValueChange={setOverheadMethod}
              options={[
                { value: CostAdjustmentMethod.Percent, label: 'Percent' },
                { value: CostAdjustmentMethod.None, label: 'None' },
                { value: CostAdjustmentMethod.FixedAmount, label: 'Fixed amount' },
              ]}
            />
            {overheadMethod === CostAdjustmentMethod.Percent ? (
              <Input
                className="mt-2"
                label="Overhead %"
                type="number"
                fullWidth
                value={overheadPercent}
                onChange={(e) => setOverheadPercent(e.target.value)}
              />
            ) : null}
          </div>
        </div>
        <Input
          label="Target margin %"
          type="number"
          fullWidth
          value={targetMarginPercent}
          onChange={(e) => setTargetMarginPercent(e.target.value)}
        />
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Assumptions
          </Typography>
          <Textarea
            value={assumptions}
            onChange={(e) => setAssumptions(e.target.value)}
            rows={2}
            placeholder="Optional notes"
          />
        </div>
        <Checkbox
          label="Mark as current finance"
          checked={markAsCurrent}
          onChange={(e) => setMarkAsCurrent(e.target.checked)}
        />
      </div>
    </Modal>
  )
}
