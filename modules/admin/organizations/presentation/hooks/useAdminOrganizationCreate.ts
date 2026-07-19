'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as organizationsApi from '../../infrastructure/api/organizations.api'
import type { CreateOrganizationPayload } from '../../domain/model/organization'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function useAdminOrganizationCreate() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createOrganization = useCallback(
    async (payload: CreateOrganizationPayload) => {
      setSubmitting(true)
      setError(null)
      try {
        const org = await organizationsApi.createOrganization(payload)
        toast.success('Organization created')
        router.push(ADMIN_ROUTES.organization(org.id))
        return org
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create organization'
        setError(msg)
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  return { createOrganization, submitting, error }
}
