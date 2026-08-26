import { NextRequest, NextResponse } from 'next/server'

const TOKEN_COOKIE = 'scopery_token'
const SESSION_COOKIE = 'scopery_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60

// BE's native cookie names — set directly on browser via rewrite-based login
const BE_ACCESS_TOKEN_COOKIE = 'access_token'
const BE_REFRESH_TOKEN_COOKIE = 'refresh_token'

function getBackendBase(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function getTargetUrl(request: NextRequest, path: string[]): string {
  const target = new URL(`/api/${path.join('/')}`, getBackendBase())
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value)
  })
  return target.toString()
}

function copyResponseHeaders(source: Response): Headers {
  const headers = new Headers(source.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')
  headers.delete('transfer-encoding')
  headers.delete('set-cookie')
  return headers
}

function isJsonResponse(response: Response): boolean {
  return (response.headers.get('content-type') ?? '').includes('application/json')
}

/**
 * Extract a cookie value from the Set-Cookie headers returned by BE.
 * Uses getSetCookie() (Node 18+ / undici) to handle multiple Set-Cookie entries safely.
 */
function getTokenFromSetCookies(headers: Headers, cookieName: string): string | null {
  const entries: string[] =
    typeof (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : []
  for (const cookie of entries) {
    const match = cookie.match(new RegExp(`^${cookieName}=([^;]+)`))
    if (match) return match[1]
  }
  return null
}

function setAuthCookie(
  response: NextResponse | Response,
  name: string,
  value: string,
  secure: boolean,
  httpOnly = true
): void {
  ;(response as NextResponse).cookies.set(name, value, {
    httpOnly,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
    secure,
  })
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await context.params
  const path = pathSegments ?? []
  const method = request.method
  const targetUrl = getTargetUrl(request, path)
  const pathStr = path.join('/')

  // Prefer scopery_token (BFF-managed after proxy login/refresh).
  // Fall back to access_token (BE-native, set directly by rewrite-based login).
  const token =
    request.cookies.get(TOKEN_COOKIE)?.value ??
    request.cookies.get(BE_ACCESS_TOKEN_COOKIE)?.value

  const headers = new Headers(request.headers)
  headers.set('host', new URL(getBackendBase()).host)
  headers.delete('cookie')

  if (token && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`)
  }

  // Refresh endpoint: re-inject the refresh_token cookie so BE can rotate tokens.
  // We strip all cookies above (security), then selectively restore refresh_token.
  const isRefreshEndpoint = pathStr === 'iam/auth/refresh'
  if (isRefreshEndpoint) {
    const refreshToken = request.cookies.get(BE_REFRESH_TOKEN_COOKIE)?.value
    if (refreshToken) {
      headers.set('cookie', `${BE_REFRESH_TOKEN_COOKIE}=${refreshToken}`)
    }
  }

  const hasBody = !['GET', 'HEAD'].includes(method)
  const backendResponse = await fetch(targetUrl, {
    method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: 'no-store',
    redirect: 'manual',
  })

  const responseHeaders = copyResponseHeaders(backendResponse)
  const secure = process.env.NODE_ENV === 'production'

  // Login / register: save access token + session from JSON body
  const isAuthSessionEndpoint =
    pathStr === 'v2/auth/login' || pathStr === 'v2/auth/register'

  if (backendResponse.ok && isAuthSessionEndpoint && isJsonResponse(backendResponse)) {
    const data = (await backendResponse.json()) as {
      access_token?: string
      user?: unknown
      profile?: unknown
    }

    const response = NextResponse.json(data, {
      status: backendResponse.status,
      headers: responseHeaders,
    })

    if (data.access_token) {
      setAuthCookie(response, TOKEN_COOKIE, data.access_token, secure)
    }

    response.cookies.set(
      SESSION_COOKIE,
      JSON.stringify({ user: data.user, profile: data.profile }),
      {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
        secure,
      }
    )

    return response
  }

  // Refresh: extract new access_token from BE's Set-Cookie, update both
  // scopery_token (BFF-managed) and access_token (keeps rewrite-path calls in sync).
  if (backendResponse.ok && isRefreshEndpoint) {
    const newAccessToken = getTokenFromSetCookies(backendResponse.headers, BE_ACCESS_TOKEN_COOKIE)
    const responseBody = await backendResponse.arrayBuffer()
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    })

    if (newAccessToken) {
      setAuthCookie(response, TOKEN_COOKIE, newAccessToken, secure)
      // Also update access_token so rewrite-path API calls stay in sync
      setAuthCookie(response, BE_ACCESS_TOKEN_COOKIE, newAccessToken, secure)
    }

    return response
  }

  if (backendResponse.ok && pathStr === 'v2/auth/logout') {
    const response = new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      headers: responseHeaders,
    })
    response.cookies.set(TOKEN_COOKIE, '', { maxAge: 0, path: '/' })
    response.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
    return response
  }

  return new NextResponse(await backendResponse.arrayBuffer(), {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
