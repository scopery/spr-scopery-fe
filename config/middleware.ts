import { AUTH_ROUTES } from '@/modules/auth/lib/routes'
import { PLATFORM_ROUTES } from '@/modules/platform/lib/routes'

/** Path prefixes that skip auth enforcement (middleware allows through). */
export const MIDDLEWARE_PUBLIC_PREFIXES = [
  '/auth',
  '/invites',
  PLATFORM_ROUTES.suspended,
] as const

/** Path prefixes that require session cookies before render. */
export const MIDDLEWARE_PROTECTED_PREFIXES = [
  '/org',
  '/admin',
  PLATFORM_ROUTES.onboarding,
] as const

/** Logged-in users hitting these paths are redirected to onboarding. */
export const MIDDLEWARE_AUTH_ENTRY_PATHS = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
] as const

export const MIDDLEWARE_REDIRECTS = {
  login: AUTH_ROUTES.login,
  onboarding: PLATFORM_ROUTES.onboarding,
} as const

/** Next.js middleware matcher — static assets and API routes excluded. */
export const MIDDLEWARE_MATCHER = [
  '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
] as const

export const middlewareConfig = {
  publicPrefixes: MIDDLEWARE_PUBLIC_PREFIXES,
  protectedPrefixes: MIDDLEWARE_PROTECTED_PREFIXES,
  authEntryPaths: MIDDLEWARE_AUTH_ENTRY_PATHS,
  redirects: MIDDLEWARE_REDIRECTS,
  matcher: MIDDLEWARE_MATCHER,
} as const
