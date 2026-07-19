'use client'

import { Suspense } from 'react'
import { VerifyEmailView } from '@/modules/auth/auth/ui/VerifyEmailView'
import { ContentLoader } from '@/shared/ui'

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <ContentLoader />
        </div>
      }
    >
      <VerifyEmailView />
    </Suspense>
  )
}
