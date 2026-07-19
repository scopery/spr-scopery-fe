'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Typography, CurrencyAmount } from '@/shared/ui'
import type { TaskEstimateSnapshot, TaskRatePreview } from '../../domain/model/estimation'

interface RateImpactPreviewModalProps {
  open: boolean
  onClose: () => void
  task: TaskEstimateSnapshot | null
  workspaceId: string
  currencyCode: string
  onPreview: (body: {
    taskId: string
    workspaceId: string
    costRoleCode?: string
    targetDate: string
    currencyCode: string
  }) => Promise<TaskRatePreview | null>
}

export function RateImpactPreviewModal({
  open,
  onClose,
  task,
  workspaceId,
  currencyCode,
  onPreview,
}: RateImpactPreviewModalProps) {
  const [costRoleCode, setCostRoleCode] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [currency, setCurrency] = useState(currencyCode)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TaskRatePreview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !task) return
    setCostRoleCode(task.costRoleCode ?? '')
    setTargetDate(new Date().toISOString().slice(0, 10))
    setCurrency(currencyCode || task.currencyCode || 'USD')
    setResult(null)
    setError(null)
  }, [open, task, currencyCode])

  const handlePreview = async () => {
    if (!task) return
    setLoading(true)
    setError(null)
    try {
      const res = await onPreview({
        taskId: task.taskId,
        workspaceId,
        costRoleCode: costRoleCode || undefined,
        targetDate,
        currencyCode: currency,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Preview rate impact"
      size="md"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        {
          label: 'Preview',
          onClick: () => void handlePreview(),
          variant: 'primary',
          loading,
          disabled: !task || !targetDate,
        },
      ]}
    >
      {!task ? (
        <Typography variant="small" tone="muted">
          Select a task to preview.
        </Typography>
      ) : (
        <div className="space-y-4">
          <Typography variant="small" tone="muted">
            {task.taskCode} · {task.taskTitle}
          </Typography>
          <Input
            label="Cost role code"
            fullWidth
            value={costRoleCode}
            onChange={(e) => setCostRoleCode(e.target.value)}
          />
          <Input
            label="Target date"
            type="date"
            fullWidth
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <Input
            label="Currency"
            fullWidth
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          />
          {error ? (
            <Typography variant="small" tone="error">
              {error}
            </Typography>
          ) : null}
          {result ? (
            <div className="space-y-2 border-t border-neutral-200 pt-3">
              <Typography variant="small" weight="medium">
                Result
              </Typography>
              <Typography variant="small" tone="muted">
                Estimate hours: {result.estimateHours ?? '—'}
              </Typography>
              {result.rateSnapshot?.baseRate != null ? (
                <Typography variant="small" tone="muted">
                  Base rate:{' '}
                  <CurrencyAmount
                    amount={result.rateSnapshot.baseRate}
                    currency={result.currencyCode ?? currency}
                    size="sm"
                  />
                </Typography>
              ) : null}
              {result.rateSnapshot?.adjustedRate != null ? (
                <Typography variant="small" tone="muted">
                  Adjusted rate:{' '}
                  <CurrencyAmount
                    amount={result.rateSnapshot.adjustedRate}
                    currency={result.currencyCode ?? currency}
                    size="sm"
                  />
                </Typography>
              ) : null}
              {result.estimatedLaborCost != null ? (
                <Typography variant="small" weight="medium">
                  Labor cost:{' '}
                  <CurrencyAmount
                    amount={result.estimatedLaborCost}
                    currency={result.currencyCode ?? currency}
                    size="sm"
                  />
                </Typography>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  )
}
