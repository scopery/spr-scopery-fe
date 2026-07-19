/** Auth route path helpers. */
export const AUTH_ROUTES = {
  login: '/auth/login',
  register: '/auth/register',
  callback: '/auth/callback',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  verifyEmail: '/auth/verify-email',
  verifyEmailRequest: '/auth/verify-email/request',
} as const

/** Personal account route path helpers. */
export const ACCOUNT_ROUTES = {
  root: '/account',
  profile: '/account/profile',
  security: '/account/security',
  sessions: '/account/sessions',
  joinRequests: '/account/join-requests',
} as const
