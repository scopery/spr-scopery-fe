import { NextRequest, NextResponse } from 'next/server'

const TOKEN_COOKIE = 'scopery_token'
const SESSION_COOKIE = 'scopery_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60

function getBackendBase(): string {
  return (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
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

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const path = context.params.path ?? []
  const method = request.method
  const targetUrl = getTargetUrl(request, path)
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const headers = new Headers(request.headers)

  headers.set('host', new URL(getBackendBase()).host)
  headers.delete('cookie')

  if (token && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`)
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
  const isAuthSessionEndpoint =
    path.join('/') === 'v2/auth/login' || path.join('/') === 'v2/auth/register'

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
      response.cookies.set(TOKEN_COOKIE, data.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
        secure,
      })
    }

    response.cookies.set(SESSION_COOKIE, JSON.stringify({ user: data.user, profile: data.profile }), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      secure,
    })

    return response
  }

  if (backendResponse.ok && path.join('/') === 'v2/auth/logout') {
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
