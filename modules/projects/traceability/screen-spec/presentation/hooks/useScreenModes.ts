'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { isModeActive } from '../../domain/rules/mode-config.rules'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type { CreateScreenModeBody, ScreenMode, UpdateScreenModeBody } from '../../domain/model/screen-spec'

export function useScreenModes(workspaceId: string | null, screenId: string | null) {
  const [items, setItems] = useState<ScreenMode[]>([])
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
      const res = await api.listScreenModes(workspaceId, screenId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load modes')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, screenId])

  useEffect(() => {
    void load()
  }, [load])

  const activeModes = useMemo(() => items.filter((m) => isModeActive(m.status)), [items])

  const createMode = useCallback(
    async (body: CreateScreenModeBody) => {
      if (!workspaceId || !screenId) return
      try {
        await api.createScreenMode(workspaceId, screenId, body)
        await load()
      } catch (err) {
        if (getErrorCode(err) === 'SCREEN_MODE_CODE_ALREADY_EXISTS') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.MODE_CODE_EXISTS,
            code: 'SCREEN_MODE_CODE_ALREADY_EXISTS',
          })
        }
        throw err
      }
    },
    [workspaceId, screenId, load]
  )

  const updateMode = useCallback(
    async (modeId: string, body: UpdateScreenModeBody) => {
      if (!workspaceId || !screenId) return
      await api.updateScreenMode(workspaceId, screenId, modeId, body)
      await load()
    },
    [workspaceId, screenId, load]
  )

  const removeMode = useCallback(
    async (modeId: string) => {
      if (!workspaceId || !screenId) return
      await api.deleteScreenMode(workspaceId, screenId, modeId)
      await load()
    },
    [workspaceId, screenId, load]
  )

  return { items, activeModes, loading, error, refetch: load, createMode, updateMode, removeMode }
}
