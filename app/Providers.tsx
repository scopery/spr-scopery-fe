'use client'

import { Toaster } from 'sonner'
import { AuthProvider } from '@/modules/auth/auth/context/AuthContext'
import { LoadingProvider } from '@/modules/platform/loading/ui/LoadingProvider'
import { ApiErrorProvider } from '@/modules/platform/providers/ApiErrorProvider'

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
        duration={3500}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: 'Questrial, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          },
          classNames: {
            toast: 'motion-fade',
          },
        }}
      />
    </AuthProvider>
  )
}
