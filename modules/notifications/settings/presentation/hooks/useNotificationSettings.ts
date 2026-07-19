'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as preferencesApi from '../../infrastructure/api/preferences.api'
import type {
  ChannelPreferences,
  CreateSubscriptionPayload,
  NotificationPreferenceProfile,
  NotificationSubscription,
  NotificationSuppression,
  UpdateNotificationPreferencePayload,
  UpsertChannelPreferencesPayload,
} from '../../domain/model/preferences'

export function useNotificationSettings(workspaceId: string | null) {
  const [preferences, setPreferences] = useState<NotificationPreferenceProfile | null>(null)
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([])
  const [channelPreferences, setChannelPreferences] = useState<ChannelPreferences | null>(null)
  const [suppressions, setSuppressions] = useState<NotificationSuppression[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [prefs, subs, channelPrefs, supps] = await Promise.all([
        preferencesApi.getPreferences(workspaceId),
        preferencesApi.listSubscriptions(workspaceId),
        preferencesApi.getChannelPreferences(workspaceId).catch(() => null),
        preferencesApi.listSuppressions(workspaceId).catch(() => []),
      ])
      setPreferences(prefs)
      setSubscriptions(subs)
      setChannelPreferences(channelPrefs)
      setSuppressions(supps ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const savePreferences = useCallback(
    async (body: UpdateNotificationPreferencePayload) => {
      if (!workspaceId) return
      const updated = await preferencesApi.updatePreferences(workspaceId, body)
      setPreferences(updated)
      return updated
    },
    [workspaceId]
  )

  const addSubscription = useCallback(
    async (body: CreateSubscriptionPayload) => {
      if (!workspaceId) return
      await preferencesApi.createSubscription(workspaceId, body)
      await load()
    },
    [workspaceId, load]
  )

  const removeSubscription = useCallback(
    async (subscriptionId: string) => {
      if (!workspaceId) return
      await preferencesApi.deleteSubscription(workspaceId, subscriptionId)
      await load()
    },
    [workspaceId, load]
  )

  const saveChannelPreferences = useCallback(
    async (body: UpsertChannelPreferencesPayload) => {
      if (!workspaceId) return
      const updated = await preferencesApi.upsertChannelPreferences(workspaceId, body)
      setChannelPreferences(updated)
      return updated
    },
    [workspaceId]
  )

  return {
    preferences,
    subscriptions,
    channelPreferences,
    suppressions,
    loading,
    error,
    forbidden,
    refetch: load,
    savePreferences,
    addSubscription,
    removeSubscription,
    saveChannelPreferences,
  }
}
