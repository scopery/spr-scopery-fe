'use client'

import { useCallback, useEffect, useState } from 'react'
import * as remindersApi from '../../infrastructure/api/reminders.api'
import type { ReminderInstance } from '../../domain/model/reminder-instance'

export function useReminders(workspaceId: string | null) {
  const [reminders, setReminders] = useState<ReminderInstance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setReminders([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await remindersApi.listReminderInstances(workspaceId)
      setReminders(res ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reminders')
      setReminders([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const snooze = useCallback(
    async (id: string, snoozedUntil: string) => {
      if (!workspaceId) return
      const updated = await remindersApi.snoozeReminder(workspaceId, id, { snoozedUntil })
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)))
    },
    [workspaceId]
  )

  const dismiss = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      await remindersApi.dismissReminder(workspaceId, id)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    },
    [workspaceId]
  )

  return { reminders, loading, error, refetch: load, snooze, dismiss }
}
