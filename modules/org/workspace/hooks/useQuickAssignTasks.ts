'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { assignTask } from '@/modules/projects/task/infrastructure/api/tasks.api'

export function useQuickAssignTasks(onDone?: () => void) {
  const [submitting, setSubmitting] = useState(false)

  const assignTasks = useCallback(
    async (
      tasks: Array<{ projectId: string; taskId: string }>,
      inChargeUserId: string
    ): Promise<{ assigned: number; skipped: number; reason?: string }> => {
      setSubmitting(true)
      let assigned = 0
      let skipped = 0
      let reason: string | undefined
      try {
        for (const task of tasks) {
          try {
            await assignTask(task.projectId, task.taskId, inChargeUserId)
            assigned += 1
          } catch {
            skipped += 1
            reason = 'Member may lack project access or task update failed'
          }
        }
        if (assigned > 0) {
          toast.success(assigned === 1 ? 'Task assigned' : `${assigned} tasks assigned`)
        }
        onDone?.()
        return { assigned, skipped, reason }
      } finally {
        setSubmitting(false)
      }
    },
    [onDone]
  )

  return { assignTasks, submitting }
}
