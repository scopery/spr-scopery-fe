'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as workspacesApi from '../../infrastructure/api/workspaces.api'
import type { CreateWorkspacePayload } from '../../domain/model/workspace'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function useAdminWorkspaceCreate() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWorkspace = useCallback(
    async (payload: CreateWorkspacePayload) => {
      setSubmitting(true)
      setError(null)
      try {
        const workspace = await workspacesApi.createWorkspace(payload)
        toast.success('Workspace created')
        router.push(ADMIN_ROUTES.workspace(workspace.id))
        return workspace
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create workspace'
        setError(msg)
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  return { createWorkspace, submitting, error }
}
