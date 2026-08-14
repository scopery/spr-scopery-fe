'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type { ScreenSpecDoc, UpsertScreenSpecDocBody } from '../../domain/model/screen-spec-doc'
import * as api from '../../infrastructure/api/spec-doc.api'

export function useScreenSpecDocs(workspaceId: string | null) {
  const [items, setItems] = useState<ScreenSpecDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listScreenSpecDocs(workspaceId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spec documents')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createDoc = useCallback(
    async (body: UpsertScreenSpecDocBody) => {
      if (!workspaceId) return
      try {
        const created = await api.createScreenSpecDoc(workspaceId, body)
        await load()
        return created
      } catch (err) {
        if (getErrorCode(err) === 'SCREEN_SPEC_DOC_CODE_ALREADY_EXISTS') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.DOC_CODE_EXISTS,
            code: 'SCREEN_SPEC_DOC_CODE_ALREADY_EXISTS',
          })
        }
        throw err
      }
    },
    [workspaceId, load]
  )

  const removeDoc = useCallback(
    async (docId: string) => {
      if (!workspaceId) return
      await api.deleteScreenSpecDoc(workspaceId, docId)
      await load()
    },
    [workspaceId, load]
  )

  return { items, loading, error, refetch: load, createDoc, removeDoc }
}
