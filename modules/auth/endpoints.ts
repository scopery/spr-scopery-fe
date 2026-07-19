import { apiPath } from '@/shared/lib/api-paths'

/**
 * Auth
 * Description: IAM authentication flows (v1): login, refresh, logout.
 *              These endpoints are CSRF-exempt (no X-XSRF-TOKEN header required).
 */
export const AUTH_ENDPOINTS = {
  /* --- Auth flows --- */
  login: () => apiPath('/iam/auth/login'),
  register: () => apiPath('/iam/users'),
  refresh: () => apiPath('/iam/auth/refresh'),
  logout: () => apiPath('/iam/auth/logout'),
  passwordResetRequest: () => apiPath('/iam/auth/password/reset-request'),
  passwordResetConfirm: () => apiPath('/iam/auth/password/reset-confirm'),
  passwordChange: () => apiPath('/iam/auth/password/change'),
  emailVerificationConfirm: () => apiPath('/iam/auth/email-verification/confirm'),
  emailVerificationSend: () => apiPath('/iam/auth/email-verification/send'),
  sessions: () => apiPath('/iam/auth/sessions'),
  revokeSession: (sessionId: string) => apiPath(`/iam/auth/sessions/${sessionId}/revoke`),
  revokeAllSessions: () => apiPath('/iam/auth/sessions/revoke-all'),
} as const

/** @deprecated Prefer `@/modules/auth/workspace-context/api/endpoints` */
export { WORKSPACE_CONTEXT_ENDPOINTS } from './workspace-context/api/endpoints'

/**
 * Profile
 * Description: Current-user profile via IAM me + user update.
 */
export const PROFILE_ENDPOINTS = {
  getProfile: () => apiPath('/iam/me'),
  updateProfile: (userId: string) => apiPath(`/iam/users/${userId}`),
  /** @deprecated Avatar upload endpoint is not available on current BE. */
  uploadAvatar: () => apiPath('/iam/me'),
} as const

/** @deprecated Prefer `@/modules/auth/onboarding/api/endpoints` — transitional re-export */
export { WORKSPACE_ONBOARDING_ENDPOINTS } from './onboarding/api/endpoints'
