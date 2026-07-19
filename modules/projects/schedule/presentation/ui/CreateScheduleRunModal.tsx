'use client'

import { useEffect, useState } from 'react'
import { Checkbox, Input, Modal, Typography } from '@/shared/ui'
import type { CreateScheduleRunPayload } from '../../domain/model/schedule'

interface CreateScheduleRunModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateScheduleRunPayload) => Promise<void>
}

export function CreateScheduleRunModal({ open, onClose, onSubmit }: CreateScheduleRunModalProps) {
  const [planningStartDate, setPlanningStartDate] = useState('')
  const [planningEndDate, setPlanningEndDate] = useState('')
  const [includeCompletedTasks, setIncludeCompletedTasks] = useState(false)
  const [useProjectAllocationsOnly, setUseProjectAllocationsOnly] = useState(false)
  const [markAsCurrent, setMarkAsCurrent] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setPlanningStartDate('')
    setPlanningEndDate('')
    setIncludeCompletedTasks(false)
    setUseProjectAllocationsOnly(false)
    setMarkAsCurrent(true)
  }, [open])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit({
        planningStartDate: planningStartDate || null,
        planningEndDate: planningEndDate || null,
        options: {
          includeCompletedTasks,
          useProjectAllocationsOnly,
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
      title="New schedule run"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Run schedule', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Leave dates empty to let the scheduler infer them from the project plan.
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Planning start date"
            type="date"
            fullWidth
            value={planningStartDate}
            onChange={(e) => setPlanningStartDate(e.target.value)}
          />
          <Input
            label="Planning end date"
            type="date"
            fullWidth
            value={planningEndDate}
            onChange={(e) => setPlanningEndDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Checkbox
            label="Include completed tasks"
            checked={includeCompletedTasks}
            onChange={(e) => setIncludeCompletedTasks(e.target.checked)}
          />
          <Checkbox
            label="Use project allocations only"
            checked={useProjectAllocationsOnly}
            onChange={(e) => setUseProjectAllocationsOnly(e.target.checked)}
          />
          <Checkbox
            label="Mark as current schedule"
            checked={markAsCurrent}
            onChange={(e) => setMarkAsCurrent(e.target.checked)}
          />
        </div>
      </div>
    </Modal>
  )
}
