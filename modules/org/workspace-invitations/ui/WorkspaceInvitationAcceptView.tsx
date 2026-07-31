'use client'

import { ArrowRight } from 'lucide-react'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, ContentLoader, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import * as workspaceInvitationsApi from '../api/workspace-invitations.api'
import { toast } from 'sonner'

/**
 * Accept workspace invitation by code — /workspace-invites/[code]
 * Do not log the code to analytics.
 */
export function WorkspaceInvitationAcceptView() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { session, bootstrapStatus, refreshBootstrap } = useAuth()
  const [status, setStatus] = useState<
    'checking' | 'need_login' | 'accepting' | 'success' | 'error'
  >('checking')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!code || bootstrapStatus === 'loading') return

    if (!session) {
      const returnTo = `/workspace-invites/${code}`
      router.replace(`${ROUTES.auth.login}?returnTo=${encodeURIComponent(returnTo)}`)
      setStatus('need_login')
      return
    }

    const accept = async () => {
      setStatus('accepting')
      try {
        await workspaceInvitationsApi.acceptWorkspaceInvitationByCode(code)
        await refreshBootstrap()
        toast.success('Workspace invitation accepted')
        setStatus('success')
        router.replace(ROUTES.onboarding)
      } catch (err) {
        setStatus('error')
        if (err instanceof ApiError) {
          const problemCode = getProblemCode(err)
          if (
            problemCode === 'WORKSPACE_INVITATION_EXPIRED' ||
            /expired/i.test(err.problem.detail || '')
          ) {
            setErrorMessage('This invitation has expired.')
          } else if (/already|member/i.test(err.problem.detail || '')) {
            setErrorMessage('You are already a member of this workspace.')
          } else {
            setErrorMessage(err.problem.detail || 'Failed to accept invitation.')
          }
        } else {
          setErrorMessage('Failed to accept invitation.')
        }
      }
    }

    void accept()
  }, [code, session, bootstrapStatus, router, refreshBootstrap])

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
          <Typography as="h1" size="md" weight="medium" className="mb-1">
            Could not accept invitation
          </Typography>
          <Typography tone="muted" className="mb-6">
            {errorMessage}
          </Typography>
          <Button
            variant="primary"
            onClick={() => router.push(ROUTES.auth.login)}
            icon={<ArrowRight size={16} />}
          >
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
