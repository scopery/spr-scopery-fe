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
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </main>
  )
}
