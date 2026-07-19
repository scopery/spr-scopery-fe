'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as api from '../../infrastructure/api/portal.api'

export function usePortalLogin() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(
    async (email: string, password: string) => {
      setSubmitting(true)
      setError(null)
      try {
        await api.portalLogin({ email, password })
        router.push('/portal/projects')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed')
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  return { login, submitting, error }
}
