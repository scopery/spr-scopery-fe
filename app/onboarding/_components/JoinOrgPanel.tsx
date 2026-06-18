'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Typography, Stack, Button, Input } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { ORG_INVITE_ENDPOINTS } from '@/constants/endpoints'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/types/api'
import { clearPendingInviteToken } from '@/utils/inviteToken'
import { toast } from 'sonner'

interface JoinOrgPanelProps {
  initialValue?: string
}

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

export function JoinOrgPanel({ initialValue = '' }: JoinOrgPanelProps) {
  const router = useRouter()
  const { refreshBootstrap } = useAuth()
  const [token, setToken] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
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
      const msg = err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to join organization'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="vertical" spacing="md">
        <Input
          label="Invite link or token"
          type="text"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={error ?? undefined}
          placeholder="Paste your invite link or token"
          fullWidth
        />
        <Button type="submit" variant="primary" fullWidth loading={loading} disabled={!token.trim()}>
          Join organization
        </Button>
        <Typography tone="muted" variant="small">
          Ask an organization owner for an invite link if you do not have one yet.
        </Typography>
      </Stack>
    </form>
  )
}
