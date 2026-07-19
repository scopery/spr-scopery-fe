'use client'

import { useCallback, useEffect, useState } from 'react'
import * as alertsApi from '../../infrastructure/api/alerts.api'
import type { AlertEvent } from '../../domain/model/alert-event'

export function useAlertEvents(workspaceId: string | null) {
  const [alerts, setAlerts] = useState<AlertEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setAlerts([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await alertsApi.listAlertEvents(workspaceId)
      setAlerts(res ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const acknowledge = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      const updated = await alertsApi.acknowledgeAlert(workspaceId, id)
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)))
    },
    [workspaceId]
  )

  const dismiss = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      await alertsApi.dismissAlert(workspaceId, id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    },
    [workspaceId]
  )

  return { alerts, loading, error, refetch: load, acknowledge, dismiss }
}
