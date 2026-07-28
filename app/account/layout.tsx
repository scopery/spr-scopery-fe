'use client'

import { useEffect, useMemo } from 'react'
import { AuthGuard } from '@/modules/platform/guards/ui/AuthGuard'
import { AppShell } from '@/modules/platform/layout/ui/AppShell'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { PageSkeleton, Typography } from '@/shared/ui'
import { AccountShell } from '@/modules/auth/account/presentation/ui/AccountShell'

const SETTINGS_MODE_KEY = 'scopery.sidebar.settingsMode'

/**
 * Personal account pages stay inside AppShell (settings mode) when a workspace
 * context exists — so users can navigate back via the settings sidebar Back link.
 * Fallback: standalone AccountShell only when no workspace is available.
 */
function AccountLayoutInner({ children }: { children: React.ReactNode }) {
  const { currentWorkspaceId, workspaces, bootstrapStatus } = useAuth()

  const workspaceId = useMemo(
    () => currentWorkspaceId ?? workspaces[0]?.id ?? null,
    [currentWorkspaceId, workspaces]
  )

  useEffect(() => {
    try {
      sessionStorage.setItem(SETTINGS_MODE_KEY, '1')
    } catch {
      /* ignore */
    }
  }, [])

  if (bootstrapStatus === 'loading') {
    return <PageSkeleton variant="split" />
  }

  if (!workspaceId) {
    return (
      <AccountShell>
        <div className="mb-4">
          <Typography variant="small" tone="muted">
            No workspace available yet. Complete onboarding to return to the app shell.
          </Typography>
        </div>
        {children}
      </AccountShell>
    )
  }

  return <AppShell workspaceId={workspaceId}>{children}</AppShell>
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AccountLayoutInner>{children}</AccountLayoutInner>
    </AuthGuard>
  )
}
