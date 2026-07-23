'use client'

import { GanttScheduleModal } from './GanttScheduleModal'

/** @deprecated Prefer `GanttScheduleModal` — kept for existing imports. */
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
  return (
    <GanttScheduleModal
      open={open}
      title="Edit task schedule"
      subtitle={taskTitle}
      startDate={startDate}
      endDate={endDate}
      saving={saving}
      onClose={onClose}
      onSave={async ({ startDate: start, endDate: end }) => {
        await onSave({ manualStartDate: start, manualFinishDate: end })
      }}
    />
  )
}
