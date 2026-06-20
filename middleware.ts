import { middlewareHandler } from '@/modules/platform/lib/middleware-handler'
import { MIDDLEWARE_MATCHER } from '@/config/middleware'

export const middleware = middlewareHandler

export const config = {
  matcher: [...MIDDLEWARE_MATCHER],
}
