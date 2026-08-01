'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/use-case.api'
import type { BulkCreateUseCaseItem, CreateUseCaseBody, UseCase } from '../model/use-case'

export function useUseCaseCatalog(projectId: string | null, functionId?: string | null) {
  const [useCases, setUseCases] = useState<UseCase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) {
      setUseCases([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const items = functionId
        ? await api.listUseCasesByFunction(projectId, functionId)
        : await api.listUseCases(projectId)
      setUseCases(items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load use cases')
    } finally {
      setLoading(false)
    }
  }, [projectId, functionId])

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
    loading,
    error,
    refetch: load,
    createUseCase,
    submitUseCasesBulk,
    deleteUseCase,
  }
}
