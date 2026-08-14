'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type {
  AddScreenSpecDocScreenBody,
  ScreenSpecDoc,
  ScreenSpecDocRevision,
  UpdateScreenSpecDocBody,
  UpsertScreenSpecDocRevisionBody,
} from '../../domain/model/screen-spec-doc'
import * as api from '../../infrastructure/api/spec-doc.api'

export function useScreenSpecDocDetail(workspaceId: string | null, docId: string | null) {
  const [doc, setDoc] = useState<ScreenSpecDoc | null>(null)
  const [revisions, setRevisions] = useState<ScreenSpecDocRevision[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !docId) {
      setDoc(null)
      setRevisions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [detail, rev] = await Promise.all([
        api.getScreenSpecDoc(workspaceId, docId),
        api.listSpecDocRevisions(workspaceId, docId),
      ])
      setDoc((prev) =>
        !detail.screens && prev?.id === detail.id && prev.screens
          ? { ...detail, screens: prev.screens }
          : detail
      )
      setRevisions(rev.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
      setDoc(null)
      setRevisions([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, docId])

  useEffect(() => {
    void load()
  }, [load])

  const saveMeta = useCallback(
    async (body: UpdateScreenSpecDocBody) => {
      if (!workspaceId || !docId) return
      try {
        const updated = await api.updateScreenSpecDoc(workspaceId, docId, body)
        setDoc(updated)
        return updated
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
    [workspaceId, docId]
  )

  const addScreen = useCallback(
    async (body: AddScreenSpecDocScreenBody) => {
      if (!workspaceId || !docId) return
      try {
        const updated = await api.addScreenToSpecDoc(workspaceId, docId, body)
        setDoc(updated)
        await load()
      } catch (err) {
        if (getErrorCode(err) === 'SPEC_DOC_SCREEN_DUPLICATE') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.SCREEN_ALREADY_IN_DOC,
            code: 'SPEC_DOC_SCREEN_DUPLICATE',
          })
        }
        throw err
      }
    },
    [workspaceId, docId, load]
  )

  const removeScreen = useCallback(
    async (screenId: string) => {
      if (!workspaceId || !docId) return
      await api.removeScreenFromSpecDoc(workspaceId, docId, screenId)
      await load()
    },
    [workspaceId, docId, load]
  )

  const addRevision = useCallback(
    async (body: UpsertScreenSpecDocRevisionBody) => {
      if (!workspaceId || !docId) return
      await api.createSpecDocRevision(workspaceId, docId, body)
      await load()
    },
    [workspaceId, docId, load]
  )

  const removeRevision = useCallback(
    async (revisionId: string) => {
      if (!workspaceId || !docId) return
      await api.deleteSpecDocRevision(workspaceId, docId, revisionId)
      await load()
    },
    [workspaceId, docId, load]
  )

  return {
    doc,
    revisions,
    loading,
    error,
    refetch: load,
    saveMeta,
    addScreen,
    removeScreen,
    addRevision,
    removeRevision,
  }
}
