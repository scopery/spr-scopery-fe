'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as wbsApi from '../../infrastructure/api/wbs.api'
import { buildWbsTree } from '../../domain/rules/wbs.rules'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'
import type {
  CreateWbsNodePayload,
  UpdateWbsNodePayload,
  WbsTreeNode,
} from '../../domain/model/wbs'

export function useProjectWbs(projectId: string | null) {
  const [raw, setRaw] = useState<Awaited<ReturnType<typeof wbsApi.getWbsTree>>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const tree = useMemo(() => buildWbsTree(raw), [raw])

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!projectId) return
    if (!opts?.silent) setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      setRaw(await wbsApi.getWbsTree(projectId))
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load Plan Structure')
      setRaw([])
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createNode = useCallback(
    async (body: CreateWbsNodePayload) => {
      if (!projectId) return
      await wbsApi.createWbsNode(projectId, body)
      await load({ silent: true })
    },
    [projectId, load]
  )

  const submitWbsNodesBulk = useCallback(
    async (items: CreateWbsNodePayload[]): Promise<BulkJobResponse> => {
      if (!projectId) throw new Error('Missing project')
      return wbsApi.submitWbsNodesBulk(projectId, items)
    },
    [projectId]
  )

  const updateNode = useCallback(
    async (id: string, body: UpdateWbsNodePayload) => {
      if (!projectId) return null
      const updated = await wbsApi.updateWbsNode(projectId, id, body)
      await load({ silent: true })
      return updated
    },
    [projectId, load]
  )

  const archiveNode = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActingId(id)
      try {
        await wbsApi.archiveWbsNode(projectId, id)
        await load({ silent: true })
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const deleteNode = useCallback(
    async (id: string) => {
      if (!projectId) return
      setActingId(id)
      try {
        await wbsApi.deleteWbsNode(projectId, id)
        await load({ silent: true })
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  return {
    tree,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createNode,
    submitWbsNodesBulk,
    updateNode,
    archiveNode,
    deleteNode,
  }
}

export type { WbsTreeNode }
