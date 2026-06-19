'use client'

import * as authApi from '../api/auth.api'

export function useAuthActions() {
  return {
    loginWithGoogle: authApi.loginWithGoogle,
    requestPasswordReset: authApi.requestPasswordReset,
  }
}
