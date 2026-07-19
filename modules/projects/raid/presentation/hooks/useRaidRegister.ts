'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as raidApi from '../../infrastructure/api/raid.api'
import type { ChangeRaidItemStatusPayload, CreateRaidItemPayload, EscalateRaidItemPayload, RaidItem, UpdateRaidItemPayload } from '../../domain/model/raid'

export function useRaidRegister(projectId: string | null, typeFilter?: string) {
  const [items, setItems] = useState<RaidItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await raidApi.listRaidItems(projectId, { type: typeFilter || undefined })
      setItems(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load RAID items')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [projectId, typeFilter])

  useEffect(() => {
    void load()
  }, [load])

  const createItem = useCallback(
    async (body: CreateRaidItemPayload) => {
      if (!projectId) return null
      const created = await raidApi.createRaidItem(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const runAction = useCallback(
    async (raidItemId: string, action: 'resolve' | 'close' | 'reopen' | 'archive') => {
      if (!projectId) return
      setActingId(raidItemId)
      try {
        if (action === 'resolve') await raidApi.resolveRaidItem(projectId, raidItemId)
        else if (action === 'close') await raidApi.closeRaidItem(projectId, raidItemId)
        else if (action === 'reopen') await raidApi.reopenRaidItem(projectId, raidItemId)
        else await raidApi.archiveRaidItem(projectId, raidItemId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const updateItem = useCallback(
    async (raidItemId: string, body: UpdateRaidItemPayload) => {
      if (!projectId) return null
      const updated = await raidApi.updateRaidItem(projectId, raidItemId, body)
      await load()
      return updated
    },
    [projectId, load]
  )

  const escalateItem = useCallback(
    async (raidItemId: string, body?: EscalateRaidItemPayload) => {
      if (!projectId) return null
      setActingId(raidItemId)
      try {
        const updated = await raidApi.escalateRaidItem(projectId, raidItemId, body)
        await load()
        return updated
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const getItem = useCallback(
    async (raidItemId: string) => {
      if (!projectId) return null
      return raidApi.getRaidItem(projectId, raidItemId)
    },
    [projectId]
  )

  const changeItemStatus = useCallback(
    async (raidItemId: string, body: ChangeRaidItemStatusPayload) => {
      if (!projectId) return null
      setActingId(raidItemId)
      try {
        const updated = await raidApi.changeRaidItemStatus(projectId, raidItemId, body)
        setItems((prev) => prev.map((r) => (r.id === raidItemId ? updated : r)))
        return updated
      } finally {
        setActingId(null)
      }
    },
    [projectId]
  )

  const convertToIssue = useCallback(
    async (raidItemId: string) => {
      if (!projectId) return null
      setActingId(raidItemId)
      try {
        const result = await raidApi.convertRiskToIssue(projectId, raidItemId)
        await load()
        return result
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const createCRDraft = useCallback(
    async (raidItemId: string) => {
      if (!projectId) return null
      setActingId(raidItemId)
      try {
        const result = await raidApi.createChangeRequestDraft(projectId, raidItemId)
        await load()
        return result
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  return {
    items,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createItem,
    runAction,
    updateItem,
    escalateItem,
    getItem,
    changeItemStatus,
    convertToIssue,
    createCRDraft,
  }
}
