/**
 * Route path helpers — re-export barrel.
 * Canonical definitions live in module lib/routes.ts files.
 */
import { AUTH_ROUTES, ACCOUNT_ROUTES } from '@/modules/auth/lib/routes'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { WORKSPACE_ROUTES, ORG_ROUTES } from '@/modules/org/lib/routes'
import { PLATFORM_ROUTES } from '@/modules/platform/lib/routes'

export {
  AUTH_ROUTES,
  ACCOUNT_ROUTES,
  ADMIN_ROUTES,
  WORKSPACE_ROUTES,
  ORG_ROUTES,
  PLATFORM_ROUTES,
}

export const ROUTES = {
  auth: AUTH_ROUTES,
  account: ACCOUNT_ROUTES,
  suspended: PLATFORM_ROUTES.suspended,
  onboarding: PLATFORM_ROUTES.onboarding,
  join: PLATFORM_ROUTES.join,
  invites: PLATFORM_ROUTES.invites,
  orgInviteAccept: PLATFORM_ROUTES.orgInviteAccept,
  admin: ADMIN_ROUTES,
  workspace: WORKSPACE_ROUTES,
  /** @deprecated Use ROUTES.workspace */
  org: ORG_ROUTES,
} as const
