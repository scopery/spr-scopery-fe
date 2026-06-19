'use client'

import { useEffect } from 'react'

/**
 * Legacy OAuth callback page — Google now redirects to /api/auth/google/callback (BFF).
 * This page only serves as a fallback; redirect home immediately.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    window.location.replace('/')
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </main>
  )
}
