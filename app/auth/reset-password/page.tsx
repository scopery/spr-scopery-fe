'use client'

import { Suspense } from 'react'
import { ResetPasswordView } from '@/modules/auth/auth/ui/ResetPasswordView'
import { ContentLoader } from '@/shared/ui'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <ContentLoader />
        </div>
      }
    >
      <ResetPasswordView />
    </Suspense>
  )
}
