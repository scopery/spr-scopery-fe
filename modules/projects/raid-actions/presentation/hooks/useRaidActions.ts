'use client'

import { useCallback, useEffect, useState } from 'react'
import * as raidActionsApi from '../../infrastructure/api/raid-actions.api'
import type { CreateRaidActionPayload, RaidAction } from '../../domain/model/raid-action'

export function useRaidActions(projectId: string | null, raidItemId: string | null) {
  const [actions, setActions] = useState<RaidAction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !raidItemId) {
      setActions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await raidActionsApi.listRaidActions(projectId, raidItemId)
      setActions(res ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load actions')
      setActions([])
    } finally {
      setLoading(false)
    }
  }, [projectId, raidItemId])

  useEffect(() => {
    void load()
  }, [load])

  const createAction = useCallback(
    async (body: CreateRaidActionPayload) => {
      if (!projectId || !raidItemId) return null
      const created = await raidActionsApi.createRaidAction(projectId, raidItemId, body)
      await load()
      return created
    },
    [projectId, raidItemId, load]
  )

  const runLifecycle = useCallback(
    async (raidActionId: string, lifecycle: 'complete' | 'cancel') => {
      if (!projectId) return null
      setActingId(raidActionId)
      try {
        const result =
          lifecycle === 'complete'
            ? await raidActionsApi.completeRaidAction(projectId, raidActionId)
            : await raidActionsApi.cancelRaidAction(projectId, raidActionId)
        await load()
        return result
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const createLinkedTask = useCallback(
    async (raidActionId: string) => {
      if (!projectId) return null
      return raidActionsApi.createLinkedTaskFromRaidAction(projectId, raidActionId)
    },
    [projectId]
  )

  return { actions, loading, error, actingId, refetch: load, createAction, runLifecycle, createLinkedTask }
}
