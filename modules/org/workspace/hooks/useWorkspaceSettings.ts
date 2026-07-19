'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as workspaceApi from '../api/workspace.api'
import type { UpdateWorkspacePayload, WorkspaceDetail } from '../model'
import { useWorkspace } from './useWorkspace'

export function useWorkspaceSettings(workspaceId: string | null) {
  const { workspace, loading, error, refetch } = useWorkspace(workspaceId)
  const [saving, setSaving] = useState(false)

  const save = useCallback(
    async (payload: UpdateWorkspacePayload): Promise<WorkspaceDetail | undefined> => {
      if (!workspaceId) return
      setSaving(true)
      try {
        const updated = await workspaceApi.updateWorkspace(workspaceId, payload)
        toast.success('Workspace settings saved')
        await refetch()
        return updated
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [workspaceId, refetch]
  )

  return { workspace, loading, error, saving, save, refetch }
}
