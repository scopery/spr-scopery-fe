'use client'

import { Send } from 'lucide-react'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button, Input, Typography, Stack, Link as DesignLink, Avatar, Divider } from '@/shared/ui'
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

export function VerifyEmailRequestView() {
  const { sendEmailVerification } = useAuthActions()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Email is required')
      return
    }
    setLoading(true)
    try {
      await sendEmailVerification({ email: trimmed })
      setSubmitted(true)
      toast.success('Verification email sent')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification email'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <div className="flex w-full items-center justify-center bg-white p-6 sm:p-8 lg:w-1/2 lg:p-10 xl:p-14">
        <div className="w-full max-w-[400px]">
          <ScoperyLogo className="mb-10" />
          <Typography
            as="h1"
            className="font-calsans mb-2 text-2xl font-bold text-neutral-900 xl:text-3xl"
          >
            Resend verification
          </Typography>
          <Typography tone="muted" className="mb-8 text-sm leading-relaxed">
            Enter your email and we&apos;ll send a new verification link.
          </Typography>
          <form onSubmit={handleSubmit}>
            <Stack direction="vertical" spacing="md">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error ?? undefined}
                placeholder="Enter your email"
                fullWidth
                autoComplete="email"
              />
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!email.trim() || loading}
                className="h-12 rounded-lg border-0 bg-gradient-to-r from-[#0a1121] to-primary text-white hover:opacity-95" icon={<Send size={16} />}>
                Send verification email
              </Button>
            </Stack>
          </form>
          {submitted && !error && (
            <Typography as="p" variant="small" tone="muted" className="mt-4 text-sm leading-relaxed">
              If an account exists for <span className="font-medium">{email.trim()}</span>, you will
              receive a verification email shortly.
            </Typography>
          )}
          <Typography as="p" variant="small" tone="muted" className="mt-8 text-center">
            Already verified?{' '}
            <DesignLink as={Link} href={ROUTES.auth.login} className="text-sm font-normal text-primary">
              Back to sign in
            </DesignLink>
          </Typography>
        </div>
      </div>
      <aside className="relative hidden min-h-[40vh] overflow-hidden lg:flex lg:min-h-screen lg:flex-1">
        <Image src="/auth_bg.jpg" alt="Scopery" width={1000} height={1000} className="absolute inset-0" />
        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <div>
            <Typography
              as="h2"
              className="font-calsans mb-6 text-3xl font-bold leading-tight text-white xl:text-4xl"
            >
              Confirm your identity.
            </Typography>
            <div className="mb-4">
              <Image src="/illustrations/quote.svg" alt="" width={50} height={50} />
            </div>
            <Typography as="p" className="font-questrial mb-8 text-lg leading-relaxed text-white xl:text-xl">
              Email verification keeps workspace access accountable and auditable.
            </Typography>
          </div>
          <div className="mt-10">
            <Divider className="mb-4 border-white/50" />
            <Typography as="p" className="mb-4 text-xs uppercase tracking-widest text-white">
              Mission
            </Typography>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:gap-3">
              {['Traceability', 'Consistency', 'Clarity', 'Audit'].map((label) => (
                <span
                  key={label}
                  className="rounded-sm border border-white/40 bg-white/10 px-3 py-2.5 text-center text-sm text-white backdrop-blur-sm"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </main>
  )
}
