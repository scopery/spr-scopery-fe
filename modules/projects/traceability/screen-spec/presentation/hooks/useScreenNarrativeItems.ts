'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/screen-spec.api'
import type {
  ScreenEventItem,
  ScreenProcessItem,
  UpsertScreenEventItemBody,
  UpsertScreenProcessItemBody,
} from '../../domain/model/screen-spec'

export function useScreenProcessItems(workspaceId: string | null, screenId: string | null) {
  const [items, setItems] = useState<ScreenProcessItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !screenId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listProcessItems(workspaceId, screenId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load processes')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, screenId])

  useEffect(() => {
    void load()
  }, [load])

  const createItem = useCallback(
    async (body: UpsertScreenProcessItemBody) => {
      if (!workspaceId || !screenId) return
      await api.createProcessItem(workspaceId, screenId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const updateItem = useCallback(
    async (itemId: string, body: UpsertScreenProcessItemBody) => {
      if (!workspaceId || !screenId) return
      await api.updateProcessItem(workspaceId, screenId, itemId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!workspaceId || !screenId) return
      await api.deleteProcessItem(workspaceId, screenId, itemId)
      await load()
    },
    [workspaceId, screenId, load]
  )

  return { items, loading, error, refetch: load, createItem, updateItem, removeItem }
}

export function useScreenEventItems(workspaceId: string | null, screenId: string | null) {
  const [items, setItems] = useState<ScreenEventItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !screenId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listEventItems(workspaceId, screenId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, screenId])

  useEffect(() => {
    void load()
  }, [load])

  const createItem = useCallback(
    async (body: UpsertScreenEventItemBody) => {
      if (!workspaceId || !screenId) return
      await api.createEventItem(workspaceId, screenId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const updateItem = useCallback(
    async (itemId: string, body: UpsertScreenEventItemBody) => {
      if (!workspaceId || !screenId) return
      await api.updateEventItem(workspaceId, screenId, itemId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!workspaceId || !screenId) return
      await api.deleteEventItem(workspaceId, screenId, itemId)
      await load()
    },
    [workspaceId, screenId, load]
  )

  return { items, loading, error, refetch: load, createItem, updateItem, removeItem }
}
