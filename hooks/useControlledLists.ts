'use client'

import { useCallback, useState } from 'react'
import { apiClient } from '@/shared/lib/apiClient'
import type { ControlledList, ControlledValue, CreateListPayload, CreateValuePayload } from '@/types/controlled-lists'
import { ApiError } from '@/types/api'
import { isMockMode } from '@/shared/lib/dataMode'
import { MOCK_CONTROLLED_LISTS, MOCK_CONTROLLED_LIST_DETAIL } from '../mocks/data/misc'

// ── useControlledLists ────────────────────────────────────────────────────────

export function useControlledLists() {
  const [lists, setLists] = useState<ControlledList[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listControlledLists = useCallback(async (orgId: string, projectId?: string | null) => {
    setLoading(true)
    setError(null)
    try {
      if (isMockMode) {
        await new Promise<void>((r) => setTimeout(r, 80))
        setLists(MOCK_CONTROLLED_LISTS.items as unknown as ControlledList[])
        return
      }
      const base = ''
      const url = projectId
        ? `${base}/api/v2/projects/${projectId}/controlled-lists`
        : `${base}/api/v2/orgs/${orgId}/controlled-lists`
      const res = await apiClient.get<{ items: ControlledList[] }>(url)
      setLists(res.items ?? [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load controlled lists')
    } finally {
      setLoading(false)
    }
  }, [])

  const createControlledList = useCallback(async (orgId: string, projectId: string | null, payload: CreateListPayload): Promise<ControlledList | null> => {
    try {
      if (isMockMode) {
        const mock = { id: `mock-list-${Date.now()}`, org_id: orgId, project_id: projectId ?? undefined, ...payload } as ControlledList
        setLists((prev) => [...prev, mock])
        return mock
      }
      const base = ''
      const url = projectId
        ? `${base}/api/v2/projects/${projectId}/controlled-lists`
        : `${base}/api/v2/orgs/${orgId}/controlled-lists`
      const res = await apiClient.post<ControlledList>(url, payload)
      setLists((prev) => [...prev, res])
      return res
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create list')
      return null
    }
  }, [])

  return { lists, loading, error, listControlledLists, createControlledList }
}

// ── useControlledListDetail ───────────────────────────────────────────────────

export function useControlledListDetail() {
  const [list, setList] = useState<ControlledList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async (orgId: string, listId: string) => {
    setLoading(true)
    setError(null)
    try {
      if (isMockMode) {
        await new Promise<void>((r) => setTimeout(r, 80))
        setList(MOCK_CONTROLLED_LIST_DETAIL as unknown as ControlledList)
        return
      }
      const base = typeof process !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
        : ''
      const res = await apiClient.get<ControlledList>(`${base}/api/v2/orgs/${orgId}/controlled-lists/${listId}`)
      setList(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load list detail')
    } finally {
      setLoading(false)
    }
  }, [])

  return { list, loading, error, fetchDetail }
}

// ── useControlledValues ────────────────────────────────────────────────────────

export function useControlledValues() {
  const [values, setValues] = useState<ControlledValue[]>([])
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  const createValue = useCallback(async (orgId: string, listId: string, payload: CreateValuePayload): Promise<ControlledValue | null> => {
    try {
      if (isMockMode) {
        const mock: ControlledValue = {
          id: `mock-val-${Date.now()}`,
          list_id: listId,
          value_key: payload.value_key,
          label: payload.label,
          description: payload.description,
          sort_order: payload.sort_order,
          is_active: payload.is_active ?? true,
        }
        setValues((prev) => [...prev, mock])
        return mock
      }
      const base = typeof process !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
        : ''
      const res = await apiClient.post<ControlledValue>(
        `${base}/api/v2/orgs/${orgId}/controlled-lists/${listId}/values`,
        payload
      )
      setValues((prev) => [...prev, res])
      return res
    } catch (err) {
      return null
    }
  }, [])

  return { values, loading, error, createValue }
}
