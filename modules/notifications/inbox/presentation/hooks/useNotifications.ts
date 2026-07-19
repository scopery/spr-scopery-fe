'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as notificationsApi from '../../infrastructure/api/notifications.api'
import type { UserNotification } from '../../domain/model/notification'
import { NotificationStatus } from '../../domain/enums/notification.enum'

export function useNotifications(pollMs = 0) {
  const [items, setItems] = useState<UserNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [page, count] = await Promise.all([
        notificationsApi.listNotifications({ page: 0, size: 50 }),
        notificationsApi.getUnreadCount(),
      ])
      setItems(page.items ?? [])
      setUnreadCount(count)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUnread = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // ignore poll errors
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!pollMs || pollMs < 5000) return
    const id = window.setInterval(() => {
      void refreshUnread()
    }, pollMs)
    return () => window.clearInterval(id)
  }, [pollMs, refreshUnread])

  const markRead = useCallback(
    async (id: string) => {
      await notificationsApi.markNotificationRead(id)
      setItems((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, status: NotificationStatus.Read, readAt: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    },
    []
  )

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllNotificationsRead()
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        status: NotificationStatus.Read,
        readAt: n.readAt ?? new Date().toISOString(),
      }))
    )
    setUnreadCount(0)
  }, [])

  const dismiss = useCallback(async (id: string) => {
    await notificationsApi.dismissNotification(id)
    setItems((prev) => prev.filter((n) => n.id !== id))
    await refreshUnread()
  }, [refreshUnread])

  return {
    items,
    unreadCount,
    loading,
    error,
    forbidden,
    refetch: load,
    refreshUnread,
    markRead,
    markAllRead,
    dismiss,
  }
}

export function useUnreadNotificationCount(pollMs = 45000) {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      setUnreadCount(await notificationsApi.getUnreadCount())
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!pollMs) return
    const id = window.setInterval(() => {
      void refresh()
    }, pollMs)
    return () => window.clearInterval(id)
  }, [pollMs, refresh])

  return { unreadCount, refresh }
}
