'use client'

import { useEffect } from 'react'
import { setupApiInterceptors } from '@/shared/lib/setupApiInterceptors'

export function ApiErrorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => setupApiInterceptors(), [])
  return <>{children}</>
}
