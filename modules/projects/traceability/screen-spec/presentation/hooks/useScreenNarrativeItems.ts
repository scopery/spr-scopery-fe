'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/screen-spec.api'
import { ordersNeedingUpdate, sortByDisplayOrder } from '../../domain/rules/display-order.rules'
import type {
  ScreenEventItem,
  ScreenProcessItem,
  UpsertScreenEventItemBody,
  UpsertScreenProcessItemBody,
} from '../../domain/model/screen-spec'

function requiredContent(content: string | null | undefined, title: string): string {
  return content?.trim() || title
}

function processUpsert(item: ScreenProcessItem, displayOrder: number): UpsertScreenProcessItemBody {
  return {
    modeId: item.modeId,
    targetFieldId: item.targetFieldId,
    title: item.title,
    content: requiredContent(item.content, item.title),
    sourceTable: item.sourceTable,
    conditionNote: item.conditionNote,
    displayOrder,
  }
}

function eventUpsert(item: ScreenEventItem, displayOrder: number): UpsertScreenEventItemBody {
  return {
    modeId: item.modeId,
    triggerFieldId: item.triggerFieldId,
    triggerActionCode: item.triggerActionCode,
    title: item.title,
    content: requiredContent(item.content, item.title),
    conditionNote: item.conditionNote,
    targetScreenId: item.targetScreenId,
    targetModeCode: item.targetModeCode,
    displayOrder,
  }
}

async function persistDisplayOrder<T extends { id: string; displayOrder: number | null }>(
  items: T[],
  orderedIds: string[],
  setItems: (next: T[]) => void,
  persist: (id: string, displayOrder: number, item: T) => Promise<void>,
  reload: () => Promise<void>
) {
  const patches = ordersNeedingUpdate(items, orderedIds)
  if (patches.length === 0) return
  const previous = items
  const byId = new Map(items.map((item) => [item.id, item]))
  setItems(
    orderedIds.flatMap((id, index) => {
      const item = byId.get(id)
      return item ? [{ ...item, displayOrder: index }] : []
    })
  )
  try {
    await Promise.all(
      patches.map((patch) => {
        const item = byId.get(patch.id)
        return item ? persist(patch.id, patch.displayOrder, item) : Promise.resolve()
      })
    )
  } catch {
    setItems(previous)
    await reload()
  }
}

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
      setItems(sortByDisplayOrder(res.items))
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
      await api.createProcessItem(workspaceId, screenId, {
        ...body,
        displayOrder: body.displayOrder ?? items.length,
      })
      await load()
    },
    [workspaceId, screenId, items.length, load]
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

  const reorderItems = useCallback(
    async (orderedIds: string[]) => {
      if (!workspaceId || !screenId) return
      await persistDisplayOrder(
        items,
        orderedIds,
        setItems,
        (id, displayOrder, item) =>
          api.updateProcessItem(workspaceId, screenId, id, processUpsert(item, displayOrder)),
        load
      )
    },
    [workspaceId, screenId, items, load]
  )

  return { items, loading, error, refetch: load, createItem, updateItem, removeItem, reorderItems }
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
      setItems(sortByDisplayOrder(res.items))
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
      await api.createEventItem(workspaceId, screenId, {
        ...body,
        displayOrder: body.displayOrder ?? items.length,
      })
      await load()
    },
    [workspaceId, screenId, items.length, load]
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

  const reorderItems = useCallback(
    async (orderedIds: string[]) => {
      if (!workspaceId || !screenId) return
      await persistDisplayOrder(
        items,
        orderedIds,
        setItems,
        (id, displayOrder, item) =>
          api.updateEventItem(workspaceId, screenId, id, eventUpsert(item, displayOrder)),
        load
      )
    },
    [workspaceId, screenId, items, load]
  )

  return { items, loading, error, refetch: load, createItem, updateItem, removeItem, reorderItems }
}
