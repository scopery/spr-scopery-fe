'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ContentLoader } from '@/shared/ui'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'

/**
 * Home (/): OAuth error params + bootstrap redirect (login / onboarding / org home).
 */
function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { bootstrapStatus, currentWorkspaceId, workspaces } = useAuth()

  useEffect(() => {
    const errorCode = searchParams.get('error_code')
    const errorDesc = searchParams.get('error_description')
    if (errorCode || searchParams.get('error')) {
      toast.error(errorDesc ? decodeURIComponent(errorDesc) : 'Sign-in failed. Please try again.')
      router.replace(`${ROUTES.auth.login}?${searchParams.toString()}`)
    }
  }, [router, searchParams])

  useEffect(() => {
    if (bootstrapStatus === 'loading') return

    switch (bootstrapStatus) {
      case 'needs_login':
        router.replace(ROUTES.auth.login)
        break
      case 'needs_onboarding':
        router.replace(ROUTES.onboarding)
        break
      case 'suspended':
        router.replace(ROUTES.suspended)
        break
      case 'ready': {
        const workspaceId = currentWorkspaceId ?? workspaces[0]?.id
        if (workspaceId) {
          router.replace(ROUTES.workspace.projects(workspaceId))
        } else {
          router.replace(ROUTES.onboarding)
        }
        break
      }
      default:
        break
    }
  }, [bootstrapStatus, currentWorkspaceId, workspaces, router])

  return (
    <main className="flex min-h-screen items-center justify-center">
      <ContentLoader />
    </main>
  )
}

export function HomeRedirectView() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <ContentLoader />
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
