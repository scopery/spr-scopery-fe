'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../api/traceability.api'
import type {
  AddStructureRelationBody,
  StructureRelation,
} from '../model/structure-relation'

const BULK_CONCURRENCY = 4

export interface BulkLinkItemResult {
  body: AddStructureRelationBody
  status: 'created' | 'skipped' | 'failed'
  relation?: StructureRelation
  message?: string
}

export interface BulkLinkResult {
  created: number
  skipped: number
  failed: number
  items: BulkLinkItemResult[]
  createdRelations: StructureRelation[]
}

export interface BulkRemoveResult {
  removed: number
  failed: number
  removedSnapshots: StructureRelation[]
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const idx = next++
      results[idx] = await fn(items[idx])
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(items.length, 1)) },
    () => worker()
  )
  await Promise.all(workers)
  return results
}

export function useStructureRelations(
  workspaceId: string | null,
  applicationId: string | null
) {
  const [items, setItems] = useState<StructureRelation[]>([])
  const [loading, setLoading] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<StructureRelation[]> => {
    if (!workspaceId || !applicationId) {
      setItems([])
      return []
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listStructureRelations(workspaceId, applicationId)
      const next = res.items ?? []
      setItems(next)
      return next
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load structure relations')
      setItems([])
      return []
    } finally {
      setLoading(false)
    }
  }, [workspaceId, applicationId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (body: AddStructureRelationBody): Promise<StructureRelation | undefined> => {
      if (!workspaceId || !applicationId) return undefined
      setIsLinking(true)
      try {
        const created = await api.createStructureRelation(workspaceId, applicationId, body)
        setItems((prev) => [...prev, created])
        return created
      } finally {
        setIsLinking(false)
      }
    },
    [workspaceId, applicationId]
  )

  const linkRelations = useCallback(
    async (bodies: AddStructureRelationBody[]): Promise<BulkLinkResult> => {
      if (!workspaceId || !applicationId || bodies.length === 0) {
        return { created: 0, skipped: 0, failed: 0, items: [], createdRelations: [] }
      }
      setIsLinking(true)
      try {
        const results = await mapPool(bodies, BULK_CONCURRENCY, async (body) => {
          try {
            const relation = await api.createStructureRelation(
              workspaceId,
              applicationId,
              body
            )
            return {
              body,
              status: 'created' as const,
              relation,
            }
          } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
              return {
                body,
                status: 'skipped' as const,
                message: 'Already exists',
              }
            }
            return {
              body,
              status: 'failed' as const,
              message:
                err instanceof ApiError
                  ? err.message
                  : err instanceof Error
                    ? err.message
                    : 'Failed',
            }
          }
        })

        const createdRelations = results
          .filter((r) => r.status === 'created' && r.relation)
          .map((r) => r.relation!)

        if (createdRelations.length) {
          setItems((prev) => {
            const ids = new Set(prev.map((x) => x.id))
            return [...prev, ...createdRelations.filter((r) => !ids.has(r.id))]
          })
        }

        return {
          created: results.filter((r) => r.status === 'created').length,
          skipped: results.filter((r) => r.status === 'skipped').length,
          failed: results.filter((r) => r.status === 'failed').length,
          items: results,
          createdRelations,
        }
      } finally {
        setIsLinking(false)
      }
    },
    [workspaceId, applicationId]
  )

  const remove = useCallback(
    async (id: string): Promise<StructureRelation | undefined> => {
      if (!workspaceId || !applicationId) return undefined
      const snapshot = items.find((r) => r.id === id)
      setIsRemoving(true)
      try {
        await api.deleteStructureRelation(workspaceId, applicationId, id)
        setItems((prev) => prev.filter((r) => r.id !== id))
        return snapshot
      } finally {
        setIsRemoving(false)
      }
    },
    [workspaceId, applicationId, items]
  )

  const removeRelations = useCallback(
    async (ids: string[]): Promise<BulkRemoveResult> => {
      if (!workspaceId || !applicationId || ids.length === 0) {
        return { removed: 0, failed: 0, removedSnapshots: [] }
      }
      setIsRemoving(true)
      const snapshots = items.filter((r) => ids.includes(r.id))
      try {
        const results = await mapPool(ids, BULK_CONCURRENCY, async (id) => {
          try {
            await api.deleteStructureRelation(workspaceId, applicationId, id)
            return { id, ok: true as const }
          } catch {
            return { id, ok: false as const }
          }
        })
        const removedIds = new Set(results.filter((r) => r.ok).map((r) => r.id))
        setItems((prev) => prev.filter((r) => !removedIds.has(r.id)))
        return {
          removed: removedIds.size,
          failed: results.filter((r) => !r.ok).length,
          removedSnapshots: snapshots.filter((s) => removedIds.has(s.id)),
        }
      } finally {
        setIsRemoving(false)
      }
    },
    [workspaceId, applicationId, items]
  )

  /** Re-create a previously deleted relation (undo remove). */
  const restore = useCallback(
    async (snapshot: StructureRelation): Promise<StructureRelation | undefined> => {
      return create({
        fromNodeType: snapshot.fromNodeType,
        fromNodeId: snapshot.fromNodeId,
        toNodeType: snapshot.toNodeType,
        toNodeId: snapshot.toNodeId,
        relationType: snapshot.relationType,
      })
    },
    [create]
  )

  return {
    items,
    loading,
    isLinking,
    isRemoving,
    error,
    refetch: load,
    create,
    linkRelations,
    remove,
    removeRelations,
    restore,
  }
}
