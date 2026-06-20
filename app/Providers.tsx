'use client'

import { Toaster } from 'sonner'
import { AuthProvider } from '@/modules/auth'
import { LoadingProvider } from '@/modules/platform'
import { ApiErrorProvider } from '@/modules/platform'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ApiErrorProvider>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </ApiErrorProvider>
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
