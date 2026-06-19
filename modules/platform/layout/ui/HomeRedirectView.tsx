'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ContentLoader } from '@/shared/ui'
import { toast } from 'sonner'

/**
 * Home (/): Only handles OAuth callback error query params; all other redirects
 * are done by AuthContext (single source of truth). See docs/BOOTSTRAP_REDIRECT.md.
 */
function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const errorCode = searchParams.get('error_code')
    const errorDesc = searchParams.get('error_description')
    if (errorCode || searchParams.get('error')) {
      toast.error(errorDesc ? decodeURIComponent(errorDesc) : 'Sign-in failed. Please try again.')
      router.replace(`${ROUTES.auth.login}?${searchParams.toString()}`)
    }
  }, [router, searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <ContentLoader variant="easeOut" className="w-20" />
    </main>
  )
}

export function HomeRedirectView() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <ContentLoader variant="easeOut" className="w-20" />
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
