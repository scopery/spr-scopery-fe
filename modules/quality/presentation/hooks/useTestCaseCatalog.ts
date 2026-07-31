'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounce } from '@/utils/useDebounce'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type {
  BatchUpdateTestCasesChanges,
  CreateTestCasePayload,
  TestCase,
  TestCaseListQuery,
  UpdateTestCasePayload,
} from '../../domain/model/quality'

const PAGE_SIZE = 50

type BulkCreateDraft = CreateTestCasePayload & { status?: string }

export function useTestCaseCatalog(projectId: string | null) {
  const [items, setItems] = useState<TestCase[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [automationStatus, setAutomationStatus] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [hasOpenDefect, setHasOpenDefect] = useState('')
  const [sort, setSort] = useState('updatedAt,desc')
  const [offset, setOffset] = useState(0)
  const debouncedQuery = useDebounce(query, 300)

  const listQuery = useMemo<TestCaseListQuery>(
    () => ({
      q: debouncedQuery || undefined,
      status: status || undefined,
      priority: priority || undefined,
      automationStatus: automationStatus || undefined,
      assigneeId: assigneeId || undefined,
      hasOpenDefect: hasOpenDefect === '' ? undefined : hasOpenDefect === 'true',
      sort,
      page: Math.floor(offset / PAGE_SIZE),
      size: PAGE_SIZE,
    }),
    [assigneeId, automationStatus, debouncedQuery, hasOpenDefect, offset, priority, sort, status]
  )

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const response = await qualityApi.listTestCases(projectId, listQuery)
      setItems(response.items)
      setTotal(response.page?.total ?? response.items.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Test Cases')
    } finally {
      setLoading(false)
    }
  }, [listQuery, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const resetOffset = useCallback(() => setOffset(0), [])

  const update = useCallback(
    async (testCaseId: string, changes: Omit<UpdateTestCasePayload, 'version'>) => {
      if (!projectId) return
      const current = items.find((item) => item.id === testCaseId)
      if (!current) return

      setSavingIds((ids) => new Set(ids).add(testCaseId))
      setItems((rows) => rows.map((row) => (row.id === testCaseId ? { ...row, ...changes } : row)))
      try {
        const updated = await qualityApi.updateTestCase(projectId, testCaseId, {
          ...changes,
          version: current.version ?? 0,
        })
        setItems((rows) =>
          rows.map((row) => (row.id === testCaseId ? { ...row, ...updated } : row))
        )
        return updated
      } catch (err) {
        setItems((rows) => rows.map((row) => (row.id === testCaseId ? current : row)))
        throw err
      } finally {
        setSavingIds((ids) => {
          const next = new Set(ids)
          next.delete(testCaseId)
          return next
        })
      }
    },
    [items, projectId]
  )

  const create = useCallback(
    async (body: CreateTestCasePayload) => {
      if (!projectId) return
      const created = await qualityApi.createTestCase(projectId, body)
      setItems((rows) => [created, ...rows])
      setTotal((value) => value + 1)
      return created
    },
    [projectId]
  )

  const bulkCreate = useCallback(
    async (rows: BulkCreateDraft[]) => {
      if (!projectId) return
      const response = await qualityApi.bulkCreateTestCases(
        projectId,
        rows.map(({ status: _status, ...row }) => row)
      )
      const groups = new Map<string, string[]>()
      response.created?.forEach((created, index) => {
        const status = rows[index]?.status
        if (!status || status === 'DRAFT') return
        groups.set(status, [...(groups.get(status) ?? []), created.id])
      })
      await Promise.all(
        [...groups.entries()].map(([status, ids]) =>
          qualityApi.batchUpdateTestCases(projectId, ids, { status })
        )
      )
      await load()
      return response
    },
    [load, projectId]
  )

  const batchUpdate = useCallback(
    async (testCaseIds: string[], changes: BatchUpdateTestCasesChanges) => {
      if (!projectId || testCaseIds.length === 0) return
      await qualityApi.batchUpdateTestCases(projectId, testCaseIds, changes)
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
    priority,
    automationStatus,
    assigneeId,
    hasOpenDefect,
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
    setPriority: (value: string) => {
      setPriority(value)
      resetOffset()
    },
    setAutomationStatus: (value: string) => {
      setAutomationStatus(value)
      resetOffset()
    },
    setAssigneeId: (value: string) => {
      setAssigneeId(value)
      resetOffset()
    },
    setHasOpenDefect: (value: string) => {
      setHasOpenDefect(value)
      resetOffset()
    },
    setSort: (value: string) => {
      setSort(value)
      resetOffset()
    },
    setOffset,
    refetch: load,
    update,
    create,
    bulkCreate,
    batchUpdate,
  }
}
