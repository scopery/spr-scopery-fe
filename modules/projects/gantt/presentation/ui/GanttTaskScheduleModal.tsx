'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Modal, Stack, Typography } from '@/shared/ui'

export interface GanttTaskScheduleModalProps {
  open: boolean
  taskTitle: string
  startDate: string
  endDate: string
  saving?: boolean
  onClose: () => void
  onSave: (body: { manualStartDate: string; manualFinishDate: string }) => Promise<void>
}

export function GanttTaskScheduleModal({
  open,
  taskTitle,
  startDate,
  endDate,
  saving = false,
  onClose,
  onSave,
}: GanttTaskScheduleModalProps) {
  const [start, setStart] = useState(startDate)
  const [end, setEnd] = useState(endDate)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStart(startDate)
    setEnd(endDate)
    setError(null)
  }, [open, startDate, endDate])

  const handleSave = async () => {
    if (!start || !end) {
      setError('Start and end dates are required')
      return
    }
    if (end < start) {
      setError('End date must be on or after start date')
      return
    }
    setError(null)
    await onSave({ manualStartDate: start, manualFinishDate: end })
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit task schedule" size="sm">
      <Stack direction="vertical" spacing="md">
        <Typography variant="small" tone="muted">
          {taskTitle}
        </Typography>
        <Input
          label="Start date"
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
        <Input
          label="Finish date"
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
        {error ? (
          <Typography variant="small" className="text-red-600">
            {error}
          </Typography>
        ) : null}
        <Stack direction="horizontal" spacing="sm" className="justify-end">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={() => void handleSave()}>
            Save
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
