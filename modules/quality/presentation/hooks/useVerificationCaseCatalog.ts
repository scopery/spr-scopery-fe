'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/utils/useDebounce'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type {
  CreateVerificationCasePayload,
  UpdateVerificationCasePayload,
  VerificationCase,
  VerificationCaseListQuery,
} from '../../domain/model/quality'

const PAGE_SIZE = 50

export function useVerificationCaseCatalog(projectId: string | null) {
  const [items, setItems] = useState<VerificationCase[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [requirementId, setRequirementId] = useState('')
  const [sort, setSort] = useState('updatedAt,desc')
  const [offset, setOffset] = useState(0)
  const debouncedQuery = useDebounce(query, 300)

  const listQuery = useMemo<VerificationCaseListQuery>(
    () => ({
      status: status || undefined,
      requirementId: requirementId || undefined,
      sort,
      page: Math.floor(offset / PAGE_SIZE),
      size: PAGE_SIZE,
    }),
    [offset, requirementId, sort, status]
  )

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const response = await qualityApi.listVerificationCases(projectId, listQuery)
      const filtered = debouncedQuery
        ? response.items.filter((item) => {
            const hay = `${item.code ?? ''} ${item.title} ${item.verificationMethod}`.toLowerCase()
            return hay.includes(debouncedQuery.toLowerCase())
          })
        : response.items
      setItems(filtered)
      setTotal(response.page?.total ?? filtered.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Verification Cases')
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, listQuery, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const resetOffset = useCallback(() => setOffset(0), [])

  const create = useCallback(
    async (body: CreateVerificationCasePayload) => {
      if (!projectId) return
      const created = await qualityApi.createVerificationCase(projectId, body)
      setItems((rows) => [created, ...rows])
      setTotal((value) => value + 1)
      return created
    },
    [projectId]
  )

  const update = useCallback(
    async (id: string, changes: Omit<UpdateVerificationCasePayload, 'version'>) => {
      if (!projectId) return
      const current = items.find((item) => item.id === id)
      if (!current) return
      setSavingIds((ids) => new Set(ids).add(id))
      setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...changes } : row)))
      try {
        const updated = await qualityApi.updateVerificationCase(projectId, id, {
          ...changes,
          version: current.version ?? 0,
        })
        setItems((rows) => rows.map((row) => (row.id === id ? { ...row, ...updated } : row)))
        return updated
      } catch (err) {
        setItems((rows) => rows.map((row) => (row.id === id ? current : row)))
        throw err
      } finally {
        setSavingIds((ids) => {
          const next = new Set(ids)
          next.delete(id)
          return next
        })
      }
    },
    [items, projectId]
  )

  const archive = useCallback(
    async (id: string) => {
      if (!projectId) return
      await qualityApi.archiveVerificationCase(projectId, id)
      await load()
    },
    [load, projectId]
  )

  return {
    items,
    total,
    loading,
    savingIds,
    error,
    query,
    status,
    requirementId,
    sort,
    offset,
    pageSize: PAGE_SIZE,
    setQuery: (value: string) => {
      setQuery(value)
      resetOffset()
    },
    setStatus: (value: string) => {
      setStatus(value)
      resetOffset()
    },
    setRequirementId: (value: string) => {
      setRequirementId(value)
      resetOffset()
    },
    setSort: (value: string) => {
      setSort(value)
      resetOffset()
    },
    setOffset,
    refetch: load,
    create,
    update,
    archive,
  }
}
