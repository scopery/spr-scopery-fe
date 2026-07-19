'use client'

import { useCallback, useEffect, useState } from 'react'
import * as workspacesApi from '../../infrastructure/api/workspaces.api'
import type { UpdateWorkspacePayload, Workspace } from '../../domain/model/workspace'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useAdminWorkspaceDetail(workspaceId: string | null) {
  const [data, setData] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      setData(await workspacesApi.getWorkspace(workspaceId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async (payload: UpdateWorkspacePayload) => {
      if (!workspaceId) return
      setSaving(true)
      try {
        const updated = await workspacesApi.updateWorkspace(workspaceId, payload)
        setData(updated)
        toast.success('Workspace updated')
        return updated
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [workspaceId]
  )

  const runAction = useCallback(
    async (action: 'activate' | 'archive') => {
      if (!workspaceId) return
      setActing(true)
      try {
        const updated =
          action === 'activate'
            ? await workspacesApi.activateWorkspace(workspaceId)
            : await workspacesApi.archiveWorkspace(workspaceId)
        setData(updated)
        toast.success(action === 'activate' ? 'Workspace activated' : 'Workspace archived')
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActing(false)
      }
    },
    [workspaceId]
  )

  return { data, loading, error, acting, saving, refetch: load, save, runAction }
}
