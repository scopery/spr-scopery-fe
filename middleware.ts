import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasAuthCookies } from '@/shared/lib/auth-cookies'

const PUBLIC_PREFIXES = ['/auth', '/invites', '/suspended'] as const
const PROTECTED_PREFIXES = ['/org', '/admin', '/onboarding'] as const
const AUTH_ENTRY_PATHS = ['/auth/login', '/auth/register'] as const

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authenticated = hasAuthCookies(request.cookies)

  if (isProtectedPath(pathname) && !authenticated) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.search = ''
    loginUrl.searchParams.set('returnTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (
    authenticated &&
    AUTH_ENTRY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    const onboardingUrl = request.nextUrl.clone()
    onboardingUrl.pathname = '/onboarding'
    onboardingUrl.search = ''
    return NextResponse.redirect(onboardingUrl)
  }

  if (pathname === '/' && authenticated) {
    const onboardingUrl = request.nextUrl.clone()
    onboardingUrl.pathname = '/onboarding'
    onboardingUrl.search = ''
    return NextResponse.redirect(onboardingUrl)
  }

  if (isPublicPath(pathname) || pathname === '/') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
