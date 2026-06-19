/** Platform-wide route path helpers (non-auth, non-org). */
export const PLATFORM_ROUTES = {
  suspended: '/suspended',
  onboarding: '/onboarding',
  invites: (token: string) => `/invites/${token}`,
} as const
