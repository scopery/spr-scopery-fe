'use client'

import { LogOut } from 'lucide-react'

import Link from 'next/link'
import { Typography, Button, Stack } from '@/shared/ui'
import { useAuth } from '../context/AuthContext'
import { ROUTES } from '@/constants/routes'

/**
 * Suspended account screen — only "Logout" action.
 * profile.status = suspended → all mutations return 403.
 */
export function SuspendedView() {
  const { logout } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <Stack direction="vertical" spacing="lg" className="max-w-md text-center">
        <Typography as="h1" size="lg" weight="semibold" className="text-neutral-900">
          Account suspended
        </Typography>
        <Typography tone="muted">
          Your account has been suspended. Please contact support if you believe this is an error.
        </Typography>
        <Button
          variant="primary"
          onClick={() => logout().then(() => window.location.replace(ROUTES.auth.login))} icon={<LogOut size={16} />}>
          Logout
        </Button>
        <Typography variant="small" tone="muted">
          <Link href={ROUTES.auth.login} className="text-primary hover:underline">
            Back to sign in
          </Link>
        </Typography>
      </Stack>
    </main>
  )
}
