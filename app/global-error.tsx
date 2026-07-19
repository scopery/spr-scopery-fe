'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/shared/ui'

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[global-error]', error)
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        <ErrorFallback
          title="Application error"
          message="Scopery encountered an unexpected error. Try reloading the page."
          detail={error.message || error.digest}
          onRetry={reset}
          retryLabel="Reload page"
        />
      </body>
    </html>
  )
}
