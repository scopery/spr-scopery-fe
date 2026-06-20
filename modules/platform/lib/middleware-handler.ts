import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { middlewareConfig } from '@/config/middleware'
import { hasAuthCookies } from '@/shared/lib/auth-cookies'
import {
  isMiddlewareAuthEntryPath,
  isMiddlewarePublicPath,
  isMiddlewareProtectedPath,
} from './middleware-paths'

export function middlewareHandler(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authenticated = hasAuthCookies(request.cookies)
  const { redirects } = middlewareConfig

  if (isMiddlewareProtectedPath(pathname) && !authenticated) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = redirects.login
    loginUrl.search = ''
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (authenticated && isMiddlewareAuthEntryPath(pathname)) {
    const onboardingUrl = request.nextUrl.clone()
    onboardingUrl.pathname = redirects.onboarding
    onboardingUrl.search = ''
    return NextResponse.redirect(onboardingUrl)
  }

  if (pathname === '/' && authenticated) {
    const onboardingUrl = request.nextUrl.clone()
    onboardingUrl.pathname = redirects.onboarding
    onboardingUrl.search = ''
    return NextResponse.redirect(onboardingUrl)
  }

  if (isMiddlewarePublicPath(pathname) || pathname === '/') {
    return NextResponse.next()
  }

  return NextResponse.next()
}
