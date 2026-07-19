'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as notificationsApi from '../../infrastructure/api/notifications.api'
import type { AutomationRuleRaw } from '../../domain/model/notification'

/**
 * NAD-05 — reminder / alert / digest rule lists are workspace-scoped and
 * their response schema is not yet documented (WAVE2_API_CONTRACT §5.11
 * lists only `POST create, GET list`). This hook fetches the raw list
 * response for a given workspace so the UI can render a thin, generic
 * read-only preview.
 */
export function useAutomationRules(workspaceId: string | null) {
  const [reminderRules, setReminderRules] = useState<AutomationRuleRaw[]>([])
  const [alertRules, setAlertRules] = useState<AutomationRuleRaw[]>([])
  const [digestRules, setDigestRules] = useState<AutomationRuleRaw[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setReminderRules([])
      setAlertRules([])
      setDigestRules([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [reminders, alerts, digests] = await Promise.all([
        notificationsApi.listReminderRules(workspaceId),
        notificationsApi.listAlertRules(workspaceId),
        notificationsApi.listDigestRules(workspaceId),
      ])
      setReminderRules(reminders)
      setAlertRules(alerts)
      setDigestRules(digests)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load automation rules')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { reminderRules, alertRules, digestRules, loading, error, refetch: load }
}
