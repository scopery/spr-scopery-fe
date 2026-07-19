'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ROUTES } from '@/constants/routes'

/**
 * When URL workspaceId differs from BE current workspace, sync via PUT /workspace-context/current.
 */
export function useWorkspaceRouteSync(workspaceId: string | undefined) {
  const router = useRouter()
  const { bootstrapStatus, workspaces, currentWorkspaceId, switchWorkspace } = useAuth()
  const syncingRef = useRef<string | null>(null)

  useEffect(() => {
    if (!workspaceId || bootstrapStatus !== 'ready') return
    if (workspaceId === currentWorkspaceId) return
    if (syncingRef.current === workspaceId) return

    const allowed = workspaces.some((w) => w.id === workspaceId)
    if (!allowed) {
      if (currentWorkspaceId) {
        router.replace(ROUTES.workspace.projects(currentWorkspaceId))
      }
      return
    }

    syncingRef.current = workspaceId
    void switchWorkspace(workspaceId).finally(() => {
      syncingRef.current = null
    })
  }, [
    workspaceId,
    bootstrapStatus,
    currentWorkspaceId,
    workspaces,
    switchWorkspace,
    router,
  ])
}
