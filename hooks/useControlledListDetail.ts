'use client'

import { useCallback, useState } from 'react'
import * as controlledListsService from '@/services/controlledLists.service'
import type { ControlledList, UpdateListPatch } from '@/types/controlled-lists'

export function useControlledListDetail() {
  const [list, setList] = useState<ControlledList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(
    async (orgId: string, listId: string): Promise<ControlledList | null> => {
      setLoading(true)
      setError(null)
      try {
        const result = await controlledListsService.getControlledList(
          { orgId },
          listId
        )
        setList(result)
        return result
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Failed to load controlled list'
        setError(msg)
        setList(null)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateList = useCallback(
    async (
      orgId: string,
      projectId: string,
      listId: string,
      patch: UpdateListPatch
    ): Promise<ControlledList> => {
      setError(null)
      const updated = await controlledListsService.updateControlledList(
        { orgId },
        projectId,
        listId,
        patch
      )
      setList(updated)
      return updated
    },
    []
  )

  return {
    list,
    loading,
    error,
    fetchDetail,
    updateList,
  }
}

