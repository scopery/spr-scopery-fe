'use client'

import { ArrowRight } from 'lucide-react'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, ContentLoader, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import * as organizationInvitationsApi from '../api/organization-invitations.api'
import { toast } from 'sonner'

/**
 * Accept organization invitation — /org-invites/[token]
 * Do not log the token to analytics.
 */
export function OrgInvitationAcceptView() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { session, bootstrapStatus, refreshBootstrap } = useAuth()
  const [status, setStatus] = useState<
    'checking' | 'need_login' | 'accepting' | 'success' | 'error'
  >('checking')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token || bootstrapStatus === 'loading') return

    if (!session) {
      const returnTo = `/org-invites/${token}`
      router.replace(`${ROUTES.auth.login}?returnTo=${encodeURIComponent(returnTo)}`)
      setStatus('need_login')
      return
    }

    const accept = async () => {
      setStatus('accepting')
      try {
        await organizationInvitationsApi.acceptOrganizationInvitation(token)
        await refreshBootstrap()
        toast.success('Organization invitation accepted')
        setStatus('success')
        router.replace(ROUTES.onboarding)
      } catch (err) {
        setStatus('error')
        if (err instanceof ApiError) {
          const code = getProblemCode(err)
          if (code === 'INVITE_EXPIRED' || /expired/i.test(err.problem.detail || '')) {
            setErrorMessage('This invitation has expired.')
          } else if (/already|accepted/i.test(err.problem.detail || '')) {
            setErrorMessage('This invitation was already accepted.')
          } else {
            setErrorMessage(err.problem.detail || 'Failed to accept invitation.')
          }
        } else {
          setErrorMessage('Failed to accept invitation.')
        }
      }
    }

    void accept()
  }, [token, session, bootstrapStatus, router, refreshBootstrap])

  if (status === 'need_login' || status === 'checking' || status === 'accepting') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <ContentLoader className="mx-auto mb-4" />
          <Typography tone="muted">
            {status === 'need_login' ? 'Redirecting to login…' : 'Accepting invitation…'}
          </Typography>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Typography as="h1" size="lg" weight="bold" className="mb-2">
            Could not accept invitation
          </Typography>
          <Typography tone="muted" className="mb-6">
            {errorMessage}
          </Typography>
          <Button variant="primary" onClick={() => router.push(ROUTES.auth.login)} icon={<ArrowRight size={16} />}>
            Go to login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Typography>Success — redirecting…</Typography>
    </div>
  )
}
