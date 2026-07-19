'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { iamRolesApi } from '@/modules/auth/iam'
import type { CreateSystemRolePayload, CreateWorkspaceRolePayload } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export type RoleCreateType = 'system' | 'workspace'

export function useIamRoleCreate() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRole = useCallback(
    async (
      type: RoleCreateType,
      payload: CreateSystemRolePayload & { workspaceId?: string }
    ) => {
      setSubmitting(true)
      setError(null)
      try {
        const role =
          type === 'workspace'
            ? await iamRolesApi.createWorkspaceRole({
                ...payload,
                workspaceId: payload.workspaceId!.trim(),
              } as CreateWorkspaceRolePayload)
            : await iamRolesApi.createSystemRole(payload)

        toast.success(type === 'workspace' ? 'Workspace role created' : 'System role created')
        router.push(ADMIN_ROUTES.iamRole(role.id))
        return role
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create role'
        setError(msg)
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  return { createRole, submitting, error }
}
