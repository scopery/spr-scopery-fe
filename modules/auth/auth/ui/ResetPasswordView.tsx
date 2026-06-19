'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button, Typography, Stack } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
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

/**
 * Reset password — used after user clicks recovery link from email.
 * If Supabase (or BE) uses hosted recovery page, this may only show instructions.
 * If app handles recovery: read token from URL and show set-new-password form (implement when BE provides endpoint).
 */
export function ResetPasswordView() {
  return (
    <main className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      <div className="flex min-h-screen w-full items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ScoperyLogo className="mb-8" />
          <Typography as="h1" className="mb-2 text-xl font-semibold text-neutral-900">
            Reset password
          </Typography>
          <Typography tone="muted" className="mb-6">
            Use the link from your email to set a new password. If you didn’t receive it, check spam
            or request a new link from the sign-in page.
          </Typography>
          <Stack direction="vertical" spacing="md">
            <Button asChild variant="primary">
              <Link href={ROUTES.auth.login}>Back to sign in</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={ROUTES.auth.forgotPassword}>Request new link</Link>
            </Button>
          </Stack>
        </div>
      </div>
    </main>
  )
}
