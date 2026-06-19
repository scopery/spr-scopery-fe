/**
 * Route path helpers — re-export barrel.
 * Canonical definitions live in module lib/routes.ts files.
 */
import { AUTH_ROUTES } from '@/modules/auth/lib/routes'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { ORG_ROUTES } from '@/modules/org/lib/routes'
import { PLATFORM_ROUTES } from '@/modules/platform/lib/routes'

export { AUTH_ROUTES, ADMIN_ROUTES, ORG_ROUTES, PLATFORM_ROUTES }

export const ROUTES = {
  auth: AUTH_ROUTES,
  suspended: PLATFORM_ROUTES.suspended,
  onboarding: PLATFORM_ROUTES.onboarding,
  invites: PLATFORM_ROUTES.invites,
  admin: ADMIN_ROUTES,
  org: ORG_ROUTES,
} as const
