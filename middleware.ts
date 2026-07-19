import { middlewareHandler } from '@/modules/platform/lib/middleware-handler'

export const middleware = middlewareHandler

/**
 * Matcher must be a static literal — Next.js cannot parse spreads/`as const` imports
 * at compile time (falls back to default matcher and slows/widens middleware).
 * Keep in sync with `MIDDLEWARE_MATCHER` in `config/middleware.ts`.
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
