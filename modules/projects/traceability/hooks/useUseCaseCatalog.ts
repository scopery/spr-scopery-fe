'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/use-case.api'
import type { BulkCreateUseCaseItem, CreateUseCaseBody, UseCase } from '../model/use-case'

const PAGE_SIZE = 50

export function useUseCaseCatalog(projectId: string | null, functionId?: string | null) {
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState('createdAt,asc')
  const [offset, setOffset] = useState(0)

  const load = useCallback(async () => {
    if (!projectId) {
      setUseCases([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (functionId) {
        const items = await api.listUseCasesByFunction(projectId, functionId)
        setUseCases(items ?? [])
        setTotal(items?.length ?? 0)
      } else {
        const res = await api.listUseCasesPaged(projectId, {
          page: Math.floor(offset / PAGE_SIZE),
          size: PAGE_SIZE,
          sort,
        })
        setUseCases(res.items)
        setTotal(res.total)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load use cases')
    } finally {
      setLoading(false)
    }
  }, [projectId, functionId, offset, sort])

  useEffect(() => {
    void load()
  }, [load])

  const createUseCase = useCallback(
    async (body: CreateUseCaseBody) => {
      if (!projectId) return
      const result = await api.createUseCase(projectId, body)
      await load()
      return result
    },
    [projectId, load]
  )

  const submitUseCasesBulk = useCallback(
    async (items: BulkCreateUseCaseItem[]) => {
      if (!projectId) throw new Error('Project required')
      return api.submitUseCasesBulk(projectId, items)
    },
    [projectId]
  )

  const deleteUseCase = useCallback(
    async (useCaseId: string) => {
      if (!projectId) return
      await api.deleteUseCase(projectId, useCaseId)
      await load()
    },
    [projectId, load]
  )

  return {
    useCases,
    total,
    loading,
    error,
    sort,
    setSort: (value: string) => { setSort(value); setOffset(0) },
    offset,
    setOffset,
    pageSize: PAGE_SIZE,
    refetch: load,
    createUseCase,
    submitUseCasesBulk,
    deleteUseCase,
  }
}
