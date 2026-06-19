'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import type { ControlledList, CreateListPayload } from '../model/controlled-lists'
import * as controlledListsApi from '../api/controlled-lists.api'

export function useControlledLists() {
  const [lists, setLists] = useState<ControlledList[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listControlledLists = useCallback(async (orgId: string, projectId?: string | null) => {
    if (!projectId) {
      setLists([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const items = await controlledListsApi.listControlledLists(orgId, projectId)
      setLists(items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load controlled lists')
    } finally {
      setLoading(false)
    }
  }, [])

  const createControlledList = useCallback(
    async (
      orgId: string,
      projectId: string | null,
      payload: CreateListPayload
    ): Promise<ControlledList | null> => {
      if (!projectId) return null
      setError(null)
      try {
        const created = await controlledListsApi.createControlledList(orgId, projectId, payload)
        setLists((prev) => [...prev, created])
        return created
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to create list')
        return null
      }
    },
    []
  )

  return { lists, loading, error, listControlledLists, createControlledList }
}
