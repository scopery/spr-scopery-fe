'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/functional-catalog.api'
import type {
  CreateFunctionalItemBody,
  CreateNonFunctionalItemBody,
  FunctionalItem,
  NonFunctionalItem,
  UpdateFunctionalItemBody,
  UpdateNonFunctionalItemBody,
} from '../model/functional-catalog'

type LoadOpts = { silent?: boolean }
type MutateOpts = { refresh?: boolean }

export function useFunctionalCatalog(projectId: string | null) {
  const [functionalItems, setFunctionalItems] = useState<FunctionalItem[]>([])
  const [nonFunctionalItems, setNonFunctionalItems] = useState<NonFunctionalItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (opts?: LoadOpts) => {
    if (!projectId) {
      setFunctionalItems([])
      setNonFunctionalItems([])
      return
    }
    if (!opts?.silent) {
      setLoading(true)
    }
    setError(null)
    try {
      const [fr, nfr] = await Promise.all([
        api.listFunctionalItems(projectId),
        api.listNonFunctionalItems(projectId),
      ])
      setFunctionalItems(fr.items ?? [])
      setNonFunctionalItems(nfr.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load functional catalog')
    } finally {
      if (!opts?.silent) {
        setLoading(false)
      }
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createFr = useCallback(
    async (body: CreateFunctionalItemBody, opts?: MutateOpts) => {
      if (!projectId) return
      await api.createFunctionalItem(projectId, body)
      if (opts?.refresh !== false) {
        await load({ silent: true })
      }
    },
    [projectId, load]
  )

  const updateFr = useCallback(
    async (id: string, body: UpdateFunctionalItemBody) => {
      if (!projectId) return
      await api.updateFunctionalItem(projectId, id, body)
      await load({ silent: true })
    },
    [projectId, load]
  )

  const removeFr = useCallback(
    async (id: string) => {
      if (!projectId) return
      await api.deleteFunctionalItem(projectId, id)
      await load({ silent: true })
    },
    [projectId, load]
  )

  const createNfr = useCallback(
    async (body: CreateNonFunctionalItemBody, opts?: MutateOpts) => {
      if (!projectId) return
      await api.createNonFunctionalItem(projectId, body)
      if (opts?.refresh !== false) {
        await load({ silent: true })
      }
    },
    [projectId, load]
  )

  const updateNfr = useCallback(
    async (id: string, body: UpdateNonFunctionalItemBody) => {
      if (!projectId) return
      await api.updateNonFunctionalItem(projectId, id, body)
      await load({ silent: true })
    },
    [projectId, load]
  )

  const removeNfr = useCallback(
    async (id: string) => {
      if (!projectId) return
      await api.deleteNonFunctionalItem(projectId, id)
      await load({ silent: true })
    },
    [projectId, load]
  )

  return {
    functionalItems,
    nonFunctionalItems,
    loading,
    error,
    refetch: load,
    createFr,
    updateFr,
    removeFr,
    createNfr,
    updateNfr,
    removeNfr,
  }
}
