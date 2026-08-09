'use client'

import { useEffect, useState } from 'react'
import { Checkbox, Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import {
  EstimationCalculationMode,
  RateTargetDateStrategy,
} from '../../domain/enums/estimation.enum'
import type { CreateEstimationRunPayload } from '../../domain/model/estimation'

interface ScheduleRunOption {
  id: string
  label: string
}

interface CreateEstimationRunModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateEstimationRunPayload) => Promise<void>
  scheduleRuns: ScheduleRunOption[]
  defaultCurrency?: string
}

export function CreateEstimationRunModal({
  open,
  onClose,
  onSubmit,
  scheduleRuns,
  defaultCurrency = 'USD',
}: CreateEstimationRunModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleRunId, setScheduleRunId] = useState('')
  const [calculationMode, setCalculationMode] = useState<string>(
    EstimationCalculationMode.TaskEstimateWithRate
  )
  const [rateStrategy, setRateStrategy] = useState<string>(
    RateTargetDateStrategy.TaskDueDateOrProjectStart
  )
  const [currencyPolicy, setCurrencyPolicy] = useState(defaultCurrency)
  const [includeCompletedTasks, setIncludeCompletedTasks] = useState(false)
  const [includeCancelledTasks, setIncludeCancelledTasks] = useState(false)
  const [includeArchivedTasks, setIncludeArchivedTasks] = useState(false)
  const [useBillingPreview, setUseBillingPreview] = useState(true)
  const [markAsCurrent, setMarkAsCurrent] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setScheduleRunId(scheduleRuns[0]?.id ?? '')
    setCalculationMode(EstimationCalculationMode.TaskEstimateWithRate)
    setRateStrategy(RateTargetDateStrategy.TaskDueDateOrProjectStart)
    setCurrencyPolicy(defaultCurrency)
    setIncludeCompletedTasks(false)
    setIncludeCancelledTasks(false)
    setIncludeArchivedTasks(false)
    setUseBillingPreview(true)
    setMarkAsCurrent(true)
  }, [open, scheduleRuns, defaultCurrency])

  const canSubmit = name.trim().length > 0 && scheduleRunId.length > 0

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        scheduleRunId,
        calculationMode: calculationMode as CreateEstimationRunPayload['calculationMode'],
        rateTargetDateStrategy:
          rateStrategy as CreateEstimationRunPayload['rateTargetDateStrategy'],
        currencyPolicy: currencyPolicy.trim() || 'USD',
        options: {
          includeCompletedTasks,
          includeCancelledTasks,
          includeArchivedTasks,
          useBillingPreview,
          markAsCurrent,
        },
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
      title="New estimation run"
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Run estimation',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: !canSubmit,
        },
      ]}
    >
      <div className="space-y-4">
        <Input
          label="Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sprint 1 Estimate"
        />
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Description
          </Typography>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional notes or assumptions"
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Schedule run
          </Typography>
          <Select
            value={scheduleRunId}
            onValueChange={setScheduleRunId}
            options={scheduleRuns.map((r) => ({ value: r.id, label: r.label }))}
            placeholder={
              scheduleRuns.length === 0 ? 'No schedule runs available' : 'Select schedule run'
            }
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Calculation mode
            </Typography>
            <Select
              value={calculationMode}
              onValueChange={setCalculationMode}
              options={[
                { value: EstimationCalculationMode.TaskEstimateOnly, label: 'Estimate only' },
                { value: EstimationCalculationMode.TaskEstimateWithRate, label: 'Estimate + rate' },
                { value: EstimationCalculationMode.ScheduledWorkWithRate, label: 'Scheduled work + rate' },
              ]}
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Rate date strategy
            </Typography>
            <Select
              value={rateStrategy}
              onValueChange={setRateStrategy}
              options={[
                { value: RateTargetDateStrategy.TaskDueDateOrProjectStart, label: 'Due date or project start' },
                { value: RateTargetDateStrategy.TaskDueDate, label: 'Task due date' },
                { value: RateTargetDateStrategy.ProjectPlannedStart, label: 'Project start date' },
                { value: RateTargetDateStrategy.TaskScheduledStart, label: 'Task scheduled start' },
                { value: RateTargetDateStrategy.TaskScheduledFinish, label: 'Task scheduled finish' },
                { value: RateTargetDateStrategy.RunDate, label: 'Run date' },
              ]}
            />
          </div>
        </div>
        <Input
          label="Currency policy"
          fullWidth
          value={currencyPolicy}
          onChange={(e) => setCurrencyPolicy(e.target.value.toUpperCase())}
        />
        <div className="space-y-2 border-t border-neutral-200 pt-3">
          <Typography variant="small" weight="medium">
            Options
          </Typography>
          <Checkbox
            label="Include completed tasks"
            checked={includeCompletedTasks}
            onChange={(e) => setIncludeCompletedTasks(e.target.checked)}
          />
          <Checkbox
            label="Include cancelled tasks"
            checked={includeCancelledTasks}
            onChange={(e) => setIncludeCancelledTasks(e.target.checked)}
          />
          <Checkbox
            label="Include archived tasks"
            checked={includeArchivedTasks}
            onChange={(e) => setIncludeArchivedTasks(e.target.checked)}
          />
          <Checkbox
            label="Use billing preview"
            checked={useBillingPreview}
            onChange={(e) => setUseBillingPreview(e.target.checked)}
          />
          <Checkbox
            label="Mark as current estimate"
            checked={markAsCurrent}
            onChange={(e) => setMarkAsCurrent(e.target.checked)}
          />
        </div>
      </div>
    </Modal>
  )
}
