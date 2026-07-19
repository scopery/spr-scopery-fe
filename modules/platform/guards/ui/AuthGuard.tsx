'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { usePlatformAdminAccess } from '@/modules/auth/iam'
import { ROUTES } from '@/constants/routes'
import { ContentLoader } from '@/shared/ui'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <ContentLoader />
    </div>
  )
}

/**
 * Redirects to /auth/login when not authenticated. Use in onboarding/org layouts.
 * Admin pages during onboarding are allowed only when GLOBAL system permissions pass.
 *
 * Cookie gate for first paint: Next.js middleware (`middleware.ts`) already redirects
 * unauthenticated requests on protected prefixes. This guard covers expired sessions
 * after the page has loaded (client bootstrap / 401).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { bootstrapStatus } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isLoading = bootstrapStatus === 'loading'
  const onOnboardingPage =
    pathname === ROUTES.onboarding || pathname?.startsWith(`${ROUTES.onboarding}/`)
  const onAdminPage = pathname?.startsWith('/admin')

  const { canAccessAdmin, loading: authzLoading } = usePlatformAdminAccess({
    enabled: onAdminPage && bootstrapStatus === 'needs_onboarding',
  })

  const allowAdminDuringOnboarding = onAdminPage && canAccessAdmin && !authzLoading

  useEffect(() => {
    if (isLoading) return

    if (bootstrapStatus === 'needs_login') {
      void import('@/shared/lib/redirectToLogin').then(({ redirectToLogin }) =>
        redirectToLogin({ returnPath: pathname })
      )
      return
    }

    if (
      bootstrapStatus === 'needs_onboarding' &&
      !onOnboardingPage &&
      !allowAdminDuringOnboarding
    ) {
      if (onAdminPage && authzLoading) return
      router.replace(ROUTES.onboarding)
    }
  }, [
    isLoading,
    bootstrapStatus,
    router,
    pathname,
    onOnboardingPage,
    allowAdminDuringOnboarding,
    onAdminPage,
    authzLoading,
  ])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (bootstrapStatus === 'needs_login') {
    return <LoadingScreen />
  }

  if (bootstrapStatus === 'needs_onboarding') {
    if (onOnboardingPage || allowAdminDuringOnboarding) {
      return <>{children}</>
    }
    return <LoadingScreen />
  }

  if (bootstrapStatus !== 'ready' && bootstrapStatus !== 'suspended') {
    return <LoadingScreen />
  }

  return <>{children}</>
}
