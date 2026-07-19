'use client'

import { Save } from 'lucide-react'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Input, Typography, Stack, Link as DesignLink } from '@/shared/ui'
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

export function ResetPasswordView() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { confirmPasswordReset } = useAuthActions()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('Reset token is missing. Request a new password reset link.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await confirmPasswordReset(token, newPassword)
      setDone(true)
      toast.success('Password updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ScoperyLogo className="mb-8" />
          <Typography as="h1" className="mb-2 text-xl font-semibold text-neutral-900">
            Reset password
          </Typography>
          {done ? (
            <Stack direction="vertical" spacing="md">
              <Typography tone="muted">Your password has been updated. You can sign in now.</Typography>
              <Link
                href={ROUTES.auth.login}
                className="inline-flex h-10 items-center justify-center bg-primary px-4 text-sm font-medium text-white"
              >
                Back to sign in
              </Link>
            </Stack>
          ) : (
            <>
              <Typography tone="muted" className="mb-6">
                Choose a new password for your account.
              </Typography>
              <form onSubmit={handleSubmit}>
                <Stack direction="vertical" spacing="md">
                  <Input
                    label="New password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    autoComplete="new-password"
                  />
                  <Input
                    label="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={error ?? undefined}
                    fullWidth
                    autoComplete="new-password"
                  />
                  <Button type="submit" variant="primary" fullWidth loading={loading} icon={<Save size={16} />}>
                    Update password
                  </Button>
                </Stack>
              </form>
              <Typography as="p" variant="small" tone="muted" className="mt-6 text-center">
                Need a new link?{' '}
                <DesignLink as={Link} href={ROUTES.auth.forgotPassword} className="text-primary">
                  Request reset
                </DesignLink>
              </Typography>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
