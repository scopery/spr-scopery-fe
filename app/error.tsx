'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/shared/ui'

export default function GlobalAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[app-error]', error)
    }
  }, [error])

  return (
    <ErrorFallback
      title="Something went wrong"
      message="This page ran into a problem. Try again or go back to the home page."
      detail={error.message || error.digest}
      onRetry={reset}
    />
  )
}
