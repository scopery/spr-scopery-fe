import { NextRequest } from 'next/server'
import { SCOPERY_TOKEN_COOKIE } from '@/shared/lib/auth-cookies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BE_ACCESS_TOKEN_COOKIE = 'access_token'

function getBackendBase(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:8080'
  ).replace(/\/$/, '')
}

/**
 * Streaming BFF for SSE. Next's `/api/:path*` rewrite buffers event-stream
 * responses; this route pipes the backend body through so tokens arrive live.
 *
 * Auth matches the rest of the app: BE HttpOnly `access_token` cookie, or
 * the BFF `scopery_token` used by `/api/proxy`.
 */
async function streamProxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: pathSegments } = await context.params
  const path = pathSegments ?? []
  const target = new URL(`/api/${path.join('/')}`, getBackendBase())
  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value)
  })

  const token =
    request.cookies.get(BE_ACCESS_TOKEN_COOKIE)?.value ??
    request.cookies.get(SCOPERY_TOKEN_COOKIE)?.value

  const headers = new Headers()
  headers.set('Accept', request.headers.get('Accept') ?? 'text/event-stream')
  headers.set('Cache-Control', 'no-cache')
  const cookie = request.headers.get('cookie')
  if (cookie) headers.set('Cookie', cookie)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const lastEventId = request.headers.get('Last-Event-ID')
  if (lastEventId && lastEventId !== '0') headers.set('Last-Event-ID', lastEventId)
  const workspaceId = request.headers.get('X-Workspace-Id')
  if (workspaceId) headers.set('X-Workspace-Id', workspaceId)
  const actorId = request.headers.get('X-Actor-Id')
  if (actorId) headers.set('X-Actor-Id', actorId)

  const backend = await fetch(target, {
    method: 'GET',
    headers,
    cache: 'no-store',
    signal: request.signal,
  })

  const out = new Headers()
  out.set('Content-Type', backend.headers.get('content-type') ?? 'text/event-stream')
  out.set('Cache-Control', 'no-cache, no-transform')
  out.set('Connection', 'keep-alive')
  out.set('X-Accel-Buffering', 'no')

  return new Response(backend.body, {
    status: backend.status,
    statusText: backend.statusText,
    headers: out,
  })
}

export const GET = streamProxy
