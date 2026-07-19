'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Typography, Stack, Link as DesignLink } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuthActions } from '../hooks/useAuthActions'
import { cn } from '@/utils/cn'

function ScoperyLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex', className)} aria-label="Scopery">
      <Image
        src="/scopery_logo.svg"
        alt="Scopery"
        width={42}
        height={42}
        style={{ width: 'auto', height: 'auto', maxWidth: 42, maxHeight: 42 }}
      />
    </Link>
  )
}

export function VerifyEmailView() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { confirmEmailVerification } = useAuthActions()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Verification token is missing. Request a new email verification link.')
      return
    }
    let cancelled = false
    const run = async () => {
      setStatus('loading')
      try {
        await confirmEmailVerification({ token })
        if (!cancelled) {
          setStatus('success')
          toast.success('Email verified')
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setMessage(err instanceof Error ? err.message : 'Verification failed')
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [token, confirmEmailVerification])

  return (
    <main className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ScoperyLogo className="mb-8" />
          <Typography as="h1" className="mb-2 text-xl font-semibold text-neutral-900">
            Verify email
          </Typography>
          {status === 'loading' && (
            <Typography tone="muted">Confirming your email address…</Typography>
          )}
          {status === 'success' && (
            <Stack direction="vertical" spacing="md">
              <Typography tone="muted">Your email has been verified. You can sign in now.</Typography>
              <Link
                href={ROUTES.auth.login}
                className="inline-flex h-10 items-center justify-center bg-primary px-4 text-sm font-medium text-white"
              >
                Continue to sign in
              </Link>
            </Stack>
          )}
          {status === 'error' && (
            <Stack direction="vertical" spacing="md">
              <Typography tone="muted">{message}</Typography>
              <DesignLink as={Link} href={ROUTES.auth.verifyEmailRequest} className="text-primary">
                Request a new verification email
              </DesignLink>
              <Link href={ROUTES.auth.login} className="text-sm text-neutral-600 hover:text-neutral-900">
                Back to sign in
              </Link>
            </Stack>
          )}
        </div>
      </div>
    </main>
  )
}
