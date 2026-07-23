'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as catalogApi from '../api/functional-catalog.api'
import type { FunctionalItem, FunctionalItemAnchor } from '../model/functional-catalog'

export interface FrAnchorRow {
  functionalItem: FunctionalItem
  anchors: FunctionalItemAnchor[]
}

/**
 * Loads project FRs + bulk functional-item-anchors index (1 round-trip for anchors).
 */
export function useFunctionalAnchorCoverage(projectId: string | null) {
  const [rows, setRows] = useState<FrAnchorRow[]>([])
  const [anchors, setAnchors] = useState<FunctionalItemAnchor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) {
      setRows([])
      setAnchors([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [frRes, anchorRes] = await Promise.all([
        catalogApi.listFunctionalItems(projectId),
        catalogApi.listFunctionalItemAnchors(projectId),
      ])
      const items = frRes.items ?? []
      const allAnchors = anchorRes.items ?? []
      setAnchors(allAnchors)

      const byFr = new Map<string, FunctionalItemAnchor[]>()
      for (const a of allAnchors) {
        const list = byFr.get(a.functionalItemId) ?? []
        list.push(a)
        byFr.set(a.functionalItemId, list)
      }
      setRows(
        items.map((item) => ({
          functionalItem: item,
          anchors: byFr.get(item.id) ?? [],
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load anchor coverage')
      setRows([])
      setAnchors([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const anchoredNodeIds = useMemo(() => {
    const set = new Set<string>()
    for (const a of anchors) set.add(a.nodeId)
    return set
  }, [anchors])

  const frWithoutAnchors = useMemo(
    () => rows.filter((r) => r.anchors.length === 0).map((r) => r.functionalItem),
    [rows]
  )

  const frWithAnchors = useMemo(
    () => rows.filter((r) => r.anchors.length > 0).map((r) => r.functionalItem),
    [rows]
  )

  const totalAnchors = anchors.length

  const anchorsForNode = useCallback(
    (nodeId: string) => anchors.filter((a) => a.nodeId === nodeId),
    [anchors]
  )

  return {
    rows,
    anchors,
    anchoredNodeIds,
    frWithoutAnchors,
    frWithAnchors,
    totalAnchors,
    anchorsForNode,
    loading,
    error,
    refetch: load,
  }
}
