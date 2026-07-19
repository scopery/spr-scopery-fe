/** Platform-wide route path helpers (non-auth, non-org). */
export const PLATFORM_ROUTES = {
  suspended: '/suspended',
  onboarding: '/onboarding',
  join: '/join',
  invites: (token: string) => `/invites/${token}`,
  orgInviteAccept: (token: string) => `/org-invites/${token}`,
} as const
