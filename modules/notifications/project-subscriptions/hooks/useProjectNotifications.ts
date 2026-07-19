'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/project-notifications.api'
import type {
  ProjectNotificationPreference,
  ProjectNotificationSubscription,
} from '../api/project-notifications.api'

export function useProjectNotifications(projectId: string | null) {
  const [subscriptions, setSubscriptions] = useState<ProjectNotificationSubscription[]>([])
  const [preferences, setPreferences] = useState<ProjectNotificationPreference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [subs, prefs] = await Promise.all([
        api.listMyProjectSubscriptions(projectId),
        api.getMyProjectPreferences(projectId),
      ])
      setSubscriptions(subs.items)
      setPreferences(prefs.preferences ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project notifications')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const subscribe = useCallback(
    async (subscriptionType = 'WATCHER') => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.subscribeToProject(projectId, { subscriptionType })
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Subscribe failed')
      }
    },
    [projectId, load]
  )

  const mute = useCallback(
    async (subscriptionId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.muteProjectSubscription(projectId, subscriptionId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Mute failed')
      }
    },
    [projectId, load]
  )

  const unmute = useCallback(
    async (subscriptionId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.unmuteProjectSubscription(projectId, subscriptionId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Unmute failed')
      }
    },
    [projectId, load]
  )

  const unsubscribe = useCallback(
    async (subscriptionId: string) => {
      if (!projectId) return
      setActionError(null)
      try {
        await api.unsubscribeFromProject(projectId, subscriptionId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Unsubscribe failed')
      }
    },
    [projectId, load]
  )

  const togglePreference = useCallback(
    async (eventCode: string, channel: string) => {
      if (!projectId) return
      setActionError(null)
      const next = preferences.map((p) =>
        p.eventCode === eventCode && p.channel === channel ? { ...p, enabled: !p.enabled } : p
      )
      const exists = preferences.some((p) => p.eventCode === eventCode && p.channel === channel)
      const payload = exists
        ? next
        : [...preferences, { eventCode, channel, enabled: true, muted: false }]
      try {
        const res = await api.upsertMyProjectPreferences(projectId, payload)
        setPreferences(res.preferences ?? payload)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Update preferences failed')
      }
    },
    [projectId, preferences]
  )

  return {
    subscriptions,
    preferences,
    loading,
    error,
    actionError,
    refetch: load,
    subscribe,
    mute,
    unmute,
    unsubscribe,
    togglePreference,
  }
}
