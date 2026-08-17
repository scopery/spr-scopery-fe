'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../../infrastructure/api/screen-spec.api'
import {
  buildModeConfigReplacePayload,
  inheritRequiredOnDrafts,
} from '../../domain/rules/mode-config.rules'
import type { ModeConfigDraft, ScreenFieldModeConfig } from '../../domain/model/screen-spec'

const FETCH_CONCURRENCY = 3

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const index = next
      next += 1
      out[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return out
}

export function useFieldModeConfigs(
  workspaceId: string | null,
  screenId: string | null,
  fieldIds: string[]
) {
  const [byFieldId, setByFieldId] = useState<Record<string, ScreenFieldModeConfig[]>>({})
  const [loading, setLoading] = useState(false)
  const idsKey = fieldIds.join(',')
  const idsRef = useRef(fieldIds)
  idsRef.current = fieldIds

  const load = useCallback(async () => {
    const ids = idsRef.current
    if (!workspaceId || !screenId || ids.length === 0) {
      setByFieldId({})
      return
    }
    setLoading(true)
    try {
      const rows = await mapPool(ids, FETCH_CONCURRENCY, async (fieldId) => {
        const res = await api.listFieldModeConfigs(workspaceId, screenId, fieldId).catch(() => ({
          items: [] as ScreenFieldModeConfig[],
        }))
        return [fieldId, res.items] as const
      })
      setByFieldId(Object.fromEntries(rows))
    } finally {
      setLoading(false)
    }
  }, [screenId, workspaceId, idsKey])

  useEffect(() => {
    void load()
  }, [load])

  const saveFieldConfigs = useCallback(
    async (
      fieldId: string,
      drafts: ModeConfigDraft[],
      fieldRequired: boolean | null | undefined
    ) => {
      if (!workspaceId || !screenId) return
      const payload = buildModeConfigReplacePayload(inheritRequiredOnDrafts(drafts), fieldRequired)
      const res = await api.replaceFieldModeConfigs(workspaceId, screenId, fieldId, payload)
      setByFieldId((prev) => ({ ...prev, [fieldId]: res.items }))
    },
    [screenId, workspaceId]
  )

  return { byFieldId, loading, refetch: load, saveFieldConfigs }
}
