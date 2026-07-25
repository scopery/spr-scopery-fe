'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as productivityApi from '../../infrastructure/api/productivity.api'
import { MyWorkWindow } from '../../domain/enums/my-work.enum'
import type { MyWorkParams, MyWorkResponse } from '../../domain/model/my-work'

const EMPTY_SUMMARY: MyWorkResponse['summary'] = {
  total: 0,
  overdue: 0,
  dueThisWindow: 0,
  inProgress: 0,
  todo: 0,
  blocked: 0,
  undated: 0,
}

export function useMyWork(workspaceId: string | null, params?: MyWorkParams) {
  const [data, setData] = useState<MyWorkResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const window = params?.window ?? MyWorkWindow.ThisWeek
  const page = params?.page ?? 0
  const size = params?.size ?? 50
  const includeCompleted = params?.includeCompleted ?? false
  const statusKey = Array.isArray(params?.status)
    ? params?.status.join(',')
    : (params?.status ?? '')
  const projectId = params?.projectId ?? ''
  const dateFrom = params?.dateFrom ?? ''
  const dateTo = params?.dateTo ?? ''

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const status =
        statusKey.trim() === ''
          ? undefined
          : statusKey.includes(',')
            ? statusKey.split(',').map((s) => s.trim()).filter(Boolean)
            : statusKey
      const res = await productivityApi.getMyWork(workspaceId, {
        window,
        page,
        size,
        includeCompleted,
        status,
        projectId: projectId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setData(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load My Work')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, window, page, size, includeCompleted, statusKey, projectId, dateFrom, dateTo])

  useEffect(() => {
    void load()
  }, [load])

  return {
    data,
    items: data?.items ?? [],
    summary: data?.summary ?? EMPTY_SUMMARY,
    pageInfo: data?.page ?? { page: 0, size, totalElements: 0, totalPages: 0 },
    dateFrom: data?.dateFrom ?? null,
    dateTo: data?.dateTo ?? null,
    loading,
    error,
    refetch: load,
  }
}
