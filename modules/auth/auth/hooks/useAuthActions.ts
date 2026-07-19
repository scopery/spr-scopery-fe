'use client'

import * as authApi from '../api/auth.api'
import * as authSessionApi from '../api/auth-session.api'

export function useAuthActions() {
  return {
    loginWithGoogle: authApi.loginWithGoogle,
    requestPasswordReset: authApi.requestPasswordReset,
    confirmPasswordReset: authApi.confirmPasswordReset,
    confirmEmailVerification: authSessionApi.confirmEmailVerification,
    sendEmailVerification: authSessionApi.sendEmailVerification,
  }
}
