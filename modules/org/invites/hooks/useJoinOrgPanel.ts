'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth'
import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/shared/lib/api-types'
import { clearPendingInviteToken } from '@/utils/inviteToken'
import { toast } from 'sonner'
import { ORG_INVITE_ENDPOINTS } from '../api/endpoints'

interface AcceptInviteResponse {
  org_id: string
}

function normalizeInviteToken(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    return url.searchParams.get('token') ?? trimmed
  } catch {
    return trimmed
  }
}

export function useJoinOrgPanel(initialValue = '') {
  const router = useRouter()
  const { refreshBootstrap } = useAuth()
  const [token, setToken] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const normalizedToken = normalizeInviteToken(token)
      if (!normalizedToken) {
        setError('Invite token is required')
        return
      }

      setLoading(true)
      setError(null)
      try {
        const result = await apiClient.post<AcceptInviteResponse>(ORG_INVITE_ENDPOINTS.accept(), {
          token: normalizedToken,
        })
        clearPendingInviteToken()
        await refreshBootstrap()
        router.replace(ROUTES.org.projects(result.org_id))
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.problem.detail
            : err instanceof Error
              ? err.message
              : 'Failed to join organization'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [token, refreshBootstrap, router]
  )

  return { token, setToken, loading, error, handleSubmit }
}
