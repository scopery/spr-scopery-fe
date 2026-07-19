'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { iamUsersApi } from '@/modules/auth/iam'
import type { CreateIamUserPayload } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function useIamUserCreate() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = useCallback(
    async (payload: CreateIamUserPayload) => {
      setSubmitting(true)
      setError(null)
      try {
        const user = await iamUsersApi.createUser(payload)
        toast.success('User created')
        router.push(ADMIN_ROUTES.iamUser(user.id))
        return user
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create user'
        setError(msg)
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  return { createUser, submitting, error }
}
