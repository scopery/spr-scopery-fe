'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { iamOwnerPoliciesApi } from '@/modules/auth/iam'
import type { CreateOwnerPolicyPayload } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function useIamOwnerPolicyCreate() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOwnerPolicy = useCallback(
    async (payload: CreateOwnerPolicyPayload) => {
      setSubmitting(true)
      setError(null)
      try {
        await iamOwnerPoliciesApi.createOwnerPolicy(payload)
        toast.success('Owner policy created')
        router.push(ADMIN_ROUTES.iamOwnerPolicies)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create owner policy'
        setError(msg)
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  return { createOwnerPolicy, submitting, error }
}
