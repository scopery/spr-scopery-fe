import { NextRequest, NextResponse } from 'next/server'
import { apiPath } from '@/shared/lib/api-paths'

const TOKEN_COOKIE = 'scopery_token'
const SESSION_COOKIE = 'scopery_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60

function getBackendBase(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:8080'
  ).replace(/\/$/, '')
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error)}`, origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', origin))
  }

  try {
    const backendUrl = new URL(apiPath('/iam/auth/google/callback'), getBackendBase())
    backendUrl.searchParams.set('code', code)

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
      const msg = String(body.detail ?? body.error ?? 'Sign-in failed')
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(msg)}`, origin))
    }

    const data = (await res.json()) as { access_token: string; user: { id: string; email: string } }
    const secure = process.env.NODE_ENV === 'production'

    const response = NextResponse.redirect(new URL('/', origin))
    response.cookies.set(TOKEN_COOKIE, data.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      secure,
    })
    response.cookies.set(SESSION_COOKIE, JSON.stringify({ user: data.user }), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      secure,
    })
    return response
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OAuth sign-in failed'
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(msg)}`, origin))
  }
}
