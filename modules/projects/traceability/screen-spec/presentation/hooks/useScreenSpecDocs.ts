'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useProjects } from '@/modules/projects/project'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type { CreateScreenSpecDocBody, ScreenSpecDoc } from '../../domain/model/screen-spec-doc'
import * as api from '../../infrastructure/api/spec-doc.api'

export function useScreenSpecDocs(workspaceId: string | null) {
  const { projects, loading: projectsLoading } = useProjects(workspaceId)
  const [items, setItems] = useState<ScreenSpecDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const projectIds = useMemo(() => projects.map((p) => p.id), [projects])
  const projectKey = projectIds.join(',')

  const load = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      return
    }
    const ids = projectKey ? projectKey.split(',') : []
    if (ids.length === 0) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(ids.map((id) => api.listScreenSpecDocs(workspaceId, id)))
      setItems(results.flatMap((res) => res.items))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spec documents')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, projectKey])

  useEffect(() => {
    void load()
  }, [load])

  const createDoc = useCallback(
    async (body: CreateScreenSpecDocBody) => {
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

  return {
    items,
    projects,
    loading: loading || projectsLoading,
    error,
    refetch: load,
    createDoc,
    removeDoc,
  }
}
