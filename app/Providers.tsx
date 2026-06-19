'use client'

import { Toaster } from 'sonner'
import { AuthProvider } from '@/modules/auth'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'Questrial, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          },
        }}
      />
    </AuthProvider>
  )
}
