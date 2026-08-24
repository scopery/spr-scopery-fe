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

const PAGE_SIZE = 50

export function useFunctionalCatalog(projectId: string | null) {
  const [functionalItems, setFunctionalItems] = useState<FunctionalItem[]>([])
  const [nonFunctionalItems, setNonFunctionalItems] = useState<NonFunctionalItem[]>([])
  const [frTotal, setFrTotal] = useState(0)
  const [nfrTotal, setNfrTotal] = useState(0)
  const [frOffset, setFrOffset] = useState(0)
  const [nfrOffset, setNfrOffset] = useState(0)
  const [sort, setSort] = useState('createdAt,asc')
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
        api.listFunctionalItems(projectId, { page: Math.floor(frOffset / PAGE_SIZE), size: PAGE_SIZE, sort }),
        api.listNonFunctionalItems(projectId, { page: Math.floor(nfrOffset / PAGE_SIZE), size: PAGE_SIZE, sort }),
      ])
      setFunctionalItems(fr.items ?? [])
      setFrTotal(fr.total)
      setNonFunctionalItems(nfr.items ?? [])
      setNfrTotal(nfr.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load functional catalog')
    } finally {
      if (!opts?.silent) {
        setLoading(false)
      }
    }
  }, [projectId, frOffset, nfrOffset, sort])

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

  const submitFunctionalItemsBulk = useCallback(
    async (items: CreateFunctionalItemBody[]) => {
      if (!projectId) throw new Error('Project required')
      return api.submitFunctionalItemsBulk(projectId, items)
    },
    [projectId]
  )

  const submitNonFunctionalItemsBulk = useCallback(
    async (items: CreateNonFunctionalItemBody[]) => {
      if (!projectId) throw new Error('Project required')
      return api.submitNonFunctionalItemsBulk(projectId, items)
    },
    [projectId]
  )

  return {
    functionalItems,
    nonFunctionalItems,
    frTotal,
    nfrTotal,
    frOffset,
    nfrOffset,
    sort,
    pageSize: PAGE_SIZE,
    setSort: (value: string) => { setSort(value); setFrOffset(0); setNfrOffset(0) },
    setFrOffset,
    setNfrOffset,
    loading,
    error,
    refetch: load,
    createFr,
    updateFr,
    removeFr,
    createNfr,
    updateNfr,
    removeNfr,
    submitFunctionalItemsBulk,
    submitNonFunctionalItemsBulk,
  }
}
