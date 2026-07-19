'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { iamGrantsApi } from '@/modules/auth/iam'
import type { CreateDelegationPayload } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function useIamDelegationCreate() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDelegation = useCallback(
    async (payload: CreateDelegationPayload) => {
      setSubmitting(true)
      setError(null)
      try {
        const grant = await iamGrantsApi.createDelegation(payload)
        toast.success('Delegation created')
        router.push(ADMIN_ROUTES.iamGrant(grant.id))
        return grant
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create delegation'
        setError(msg)
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  return { createDelegation, submitting, error }
}
