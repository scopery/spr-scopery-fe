'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/constants/routes'
import { ContentLoader } from '@/shared/ui'

/**
 * Redirects to /auth/login when not authenticated. Use in onboarding/org layouts.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, bootstrapStatus } = useAuth()
  const router = useRouter()
  const isLoading = bootstrapStatus === 'loading'

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      router.replace(ROUTES.auth.login)
    }
  }, [isLoading, session, router])

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  return <>{children}</>
}
