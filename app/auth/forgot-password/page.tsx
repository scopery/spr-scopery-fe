'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Button,
  Input,
  Typography,
  Stack,
  Link as DesignLink,
  Avatar,
  Divider,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils'
import { useAuthActions } from '@/hooks/useAuthActions'

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

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuthActions()
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
      await requestPasswordReset(trimmed)
      setSubmitted(true)
      toast.success('Password reset link has been sent to your email')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send password reset link'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: content + form */}
      <div className="w-full lg:w-1/2 xl:w-1/2 flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10 xl:p-14">
        <div className="w-full max-w-[400px]">
          <ScoperyLogo className="mb-10" />

          <Typography
            as="h1"
            className="text-neutral-900 text-2xl xl:text-3xl font-calsans font-bold mb-2"
          >
            Forgot password
          </Typography>
          <Typography tone="muted" className="mb-8 text-sm leading-relaxed">
            Enter the email associated with your account, and we&apos;ll send you a secure
            link to reset your password.
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
                className="bg-gradient-to-r from-[#0a1121] to-primary text-white border-0 h-12 rounded-lg hover:opacity-95"
              >
                Send reset link
              </Button>
            </Stack>
          </form>

          {submitted && !error && (
            <Typography
              as="p"
              variant="small"
              tone="muted"
              className="mt-4 text-sm leading-relaxed"
            >
              If an account exists for <span className="font-medium">{email.trim()}</span>, you
              will receive an email with instructions to reset your password shortly.
            </Typography>
          )}

          <Typography
            as="p"
            variant="small"
            tone="muted"
            className="mt-8 text-center"
          >
            Remember your password?{' '}
            <DesignLink
              as={Link}
              href={ROUTES.auth.login}
              className="font-normal text-primary text-sm"
            >
              Back to sign in
            </DesignLink>
          </Typography>
        </div>
      </div>

      {/* Right: same visual panel as login/register for consistency */}
      <aside className="hidden lg:flex lg:flex-1 relative min-h-[40vh] lg:min-h-screen overflow-hidden">
        <Image
          src="/auth_bg.jpg"
          alt="Scopery"
          width={1000}
          height={1000}
          className="absolute inset-0"
        />
        <div className="absolute inset-0 opacity-30" aria-hidden>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="cable-blur-forgot">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
              </filter>
            </defs>
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1={-20 + i * 25}
                y1={-10}
                x2={120 + i * 25}
                y2={110}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth="24"
                filter="url(#cable-blur-forgot)"
              />
            ))}
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div>
            <Typography
              as="h2"
              className="text-white text-3xl xl:text-4xl font-calsans font-bold leading-tight mb-6"
            >
              Secure access, without friction.
            </Typography>
            <div
              className="text-white/90 text-5xl xl:text-6xl font-serif leading-none mb-4 select-none"
              aria-hidden
            >
              <Image src="/illustrations/quote.svg" alt="quote" width={50} height={50} />
            </div>
            <Typography
              as="p"
              className="text-white text-lg xl:text-xl leading-relaxed mb-8 font-questrial"
            >
              Quick account recovery keeps your team moving. Reset access securely and get
              back to crafting precise, auditable specifications.
            </Typography>
            <div className="flex items-center gap-4">
              <Avatar
                size="md"
                src="/illustrations/avatar.jpg"
                alt="Iris Nguyen"
                fallback="IN"
              />
              <div>
                <Typography as="p" className="text-white font-medium font-calsans text-base">
                  Iris Nguyen
                </Typography>
                <Typography as="p" className="text-white/80 text-sm font-questrial">
                  Business Analyst at Archetype Group
                </Typography>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Divider className="border-white/50 mb-4" />
            <Typography as="p" className="text-white text-xs uppercase tracking-widest mb-4">
              Mission
            </Typography>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 xl:gap-3">
              {[
                'Traceability',
                'Consistency',
                'Clarity',
                'Speed',
                'Structure',
                'Precision',
                'Alignment',
                'Audit',
              ].map((label) => (
                <span
                  key={label}
                  className="py-2.5 px-3 xl:py-3 xl:px-4 rounded-sm border border-white/40 bg-white/10 text-white text-sm text-center backdrop-blur-sm"
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

