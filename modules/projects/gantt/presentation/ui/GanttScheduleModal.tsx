'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Modal, Stack, Typography } from '@/shared/ui'

export interface GanttScheduleModalProps {
  open: boolean
  title: string
  subtitle?: string
  startDate: string
  endDate: string
  saving?: boolean
  onClose: () => void
  onSave: (body: { startDate: string; endDate: string }) => Promise<void>
}

/** Shared start/end editor for task schedule or phase planned dates. */
export function GanttScheduleModal({
  open,
  title,
  subtitle,
  startDate,
  endDate,
  saving = false,
  onClose,
  onSave,
}: GanttScheduleModalProps) {
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
    await onSave({ startDate: start, endDate: end })
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <Stack direction="vertical" spacing="md">
        {subtitle ? (
          <Typography variant="small" tone="muted">
            {subtitle}
          </Typography>
        ) : null}
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
