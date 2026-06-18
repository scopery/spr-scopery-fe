'use client'

/**
 * Invite accept page — /invites/[token].
 * Security: Do not log or send the token to analytics/error reporting (e.g. Sentry).
 * If using Sentry, scrub the route param in beforeSend so /invites/[token] becomes /invites/[REDACTED].
 */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Typography, Button, ContentLoader } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useOrgInviteActions } from '@/hooks/useOrgInviteActions'
import { useOrgActions } from '@/hooks/useOrgActions'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError, getProblemCode } from '@/types/api'
import { clearPendingInviteToken, setPendingInviteToken } from '@/utils/inviteToken'
import { toast } from 'sonner'

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const { session, currentOrgId, refreshBootstrap, bootstrapStatus } = useAuth()
  const { acceptInvite } = useOrgInviteActions()
  const { setDefaultOrg } = useOrgActions()

  const [status, setStatus] = useState<'checking' | 'need_login' | 'accepting' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    if (!token || bootstrapStatus === 'loading') return

    if (!session) {
      setPendingInviteToken(token)
      const returnTo = `/invites/${token}`
      router.replace(`${ROUTES.auth.login}?returnTo=${encodeURIComponent(returnTo)}`)
      setStatus('need_login')
      return
    }

    const accept = async () => {
      setStatus('accepting')
      try {
        const res = await acceptInvite(token)
        clearPendingInviteToken()
        try {
          await setDefaultOrg(res.org_id)
        } catch (defaultErr) {
          toast.warning('Joined. Could not set default org — you can switch in the menu.')
        }
        await refreshBootstrap()
        toast.success('Invite accepted')
        setStatus('success')
        router.replace(ROUTES.org.projects(res.org_id))
      } catch (err) {
        setStatus('error')
        if (err instanceof ApiError) {
          const code = getProblemCode(err)
          if (code === 'INVITE_EXPIRED') setErrorMessage('Invite has expired.')
          else if (code === 'INVITE_INVALID') setErrorMessage('Invite is invalid.')
          else if (code === 'INVITE_EMAIL_MISMATCH') setErrorMessage('Email does not match the invite.')
          else if (code === 'ALREADY_ACCEPTED') setErrorMessage('Invite was already accepted.')
          else if (code === 'TOO_MANY_REQUESTS') setErrorMessage('Too many requests. Please try again later.')
          else setErrorMessage(err.problem.detail || 'Failed to accept invite.')
        } else {
          setErrorMessage('Failed to accept invite. Please try again later.')
        }
      }
    }

    accept()
  }, [token, session, router, refreshBootstrap])

  if (status === 'need_login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <ContentLoader variant="easeOut" className="w-20 mx-auto mb-4" />
          <Typography>Redirecting to login...</Typography>
        </div>
      </div>
    )
  }

  if (status === 'accepting' || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <ContentLoader variant="easeOut" className="w-20 mx-auto mb-4" />
          <Typography>Accepting invite...</Typography>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="max-w-md text-center space-y-4">
          <Typography as="h1" weight="bold" tone="error">
            Could not accept invite
          </Typography>
          <Typography>{errorMessage}</Typography>
          <Button
            variant="primary"
            onClick={() => router.push(currentOrgId ? ROUTES.org.projects(currentOrgId) : '/')}
          >
            Go to projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <ContentLoader variant="easeOut" className="w-20" />
    </div>
  )
}
