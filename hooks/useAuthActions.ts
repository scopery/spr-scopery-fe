'use client'

import { loginWithGoogle, requestPasswordReset } from '@/services/auth.service'

export function useAuthActions() {
  return { loginWithGoogle, requestPasswordReset }
}
