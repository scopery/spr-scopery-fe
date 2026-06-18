/**
 * API client — v2 API.
 * - Success: returns object directly (no { ok, data } envelope).
 * - Error: parses application/problem+json (RFC 9457), throws ApiError.
 * - Client-side: requests are routed through /api/proxy/* (Next.js BFF).
 *   The proxy reads the HttpOnly scopery_token cookie and adds Authorization header.
 * - On 401: clear session and redirect to login.
 *
 * Mock mode (NEXT_PUBLIC_DATA_MODE=mock):
 *   Every request is intercepted before fetch(). The mock resolver maps the URL
 *   to fixture data from mocks/resolver.ts. No real network calls are made.
 *   Auth bootstrap is satisfied by seeding a mock session cookie on first load.
 */

import type { ProblemDetails } from '@/types/api'
import { ApiError } from '@/types/api'
import { isMockMode, MOCK_DELAY_MS } from './dataMode'
import { resolveMock, MOCK_SESSION_COOKIE_VALUE } from '../../mocks'

const LOGIN_PATH = '/auth/login'

/** Paths that contain sensitive tokens — do not use as returnTo */
const TOKEN_PATH_PREFIX = '/invites/'

const SESSION_COOKIE_NAME = 'scopery_session'
/** 7 days in seconds */
const SESSION_MAX_AGE = 7 * 24 * 60 * 60

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getJwtAlg(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return (JSON.parse(json) as { alg?: string }).alg ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Mock mode: seed a fake session cookie so AuthContext bootstraps correctly
// ---------------------------------------------------------------------------

function seedMockSession(): void {
  if (!isMockMode || typeof document === 'undefined') return
  const existing = getCookieRaw(SESSION_COOKIE_NAME)
  if (existing) return
  const value = encodeURIComponent(MOCK_SESSION_COOKIE_VALUE)
  document.cookie = `${encodeURIComponent(SESSION_COOKIE_NAME)}=${value}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax`
}

/** Raw cookie getter — used before setCookie/deleteCookie are defined. */
function getCookieRaw(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEq = encodeURIComponent(name) + '='
  for (const c of document.cookie.split('; ')) {
    if (c.startsWith(nameEq)) return decodeURIComponent(c.slice(nameEq.length))
  }
  return null
}

if (isMockMode && typeof window !== 'undefined') {
  seedMockSession()
}

/** Read cookie by name (client-only). */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEq = encodeURIComponent(name) + '='
  const cookies = document.cookie.split('; ')
  for (const c of cookies) {
    if (c.startsWith(nameEq)) {
      return decodeURIComponent(c.slice(nameEq.length))
    }
  }
  return null
}

/** Set cookie with security flags (client-only). */
function setCookie(
  name: string,
  value: string,
  options: { maxAge?: number; path?: string; secure?: boolean; sameSite?: 'Lax' | 'Strict' | 'None' } = {}
): void {
  if (typeof document === 'undefined') return
  const { maxAge = SESSION_MAX_AGE, path = '/', sameSite = 'Lax' } = options
  const secure = options.secure ?? (typeof window !== 'undefined' && window.location?.protocol === 'https:')
  const parts = [
    encodeURIComponent(name) + '=' + encodeURIComponent(value),
    'path=' + path,
    'max-age=' + maxAge,
    'SameSite=' + sameSite,
  ]
  if (secure) parts.push('Secure')
  document.cookie = parts.join('; ')
}

/** Remove cookie (client-only). */
function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') return
  document.cookie = encodeURIComponent(name) + '=; path=' + path + '; max-age=0; SameSite=Lax'
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = getCookie(SESSION_COOKIE_NAME)
    if (!raw) return null
    const session = JSON.parse(raw) as { accessToken?: string; access_token?: string }
    return session.accessToken ?? session.access_token ?? null
  } catch {
    return null
  }
}

/** Read full session from cookie (for AuthContext). */
export function getSessionFromCookie(): { accessToken?: string; refreshToken?: string; user: unknown } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = getCookie(SESSION_COOKIE_NAME)
    if (!raw) return null
    return JSON.parse(raw) as { accessToken?: string; refreshToken?: string; user: unknown }
  } catch {
    return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeSession(session: Record<string, unknown>): {
  accessToken?: string
  refreshToken?: string
  user: unknown
} {
  const s = session as Record<string, unknown>
  return {
    accessToken: (s.accessToken ?? s.access_token) as string | undefined,
    refreshToken: (s.refreshToken ?? s.refresh_token) as string | undefined,
    user: s.user,
  }
}

export function setSessionStorage(session: {
  accessToken?: string
  refreshToken?: string
  access_token?: string
  refresh_token?: string
  user: unknown
}): void {
  if (typeof window === 'undefined') return
  const s = session as Record<string, unknown>
  // Store only user info — the JWT is managed by the HttpOnly scopery_token cookie
  // set server-side by the /api/proxy BFF on login/register/google-callback.
  const value = JSON.stringify({ user: s.user })
  setCookie(SESSION_COOKIE_NAME, value, {
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'Lax',
    secure: window.location?.protocol === 'https:',
  })
}

export function clearSessionStorage(): void {
  if (typeof window === 'undefined') return
  deleteCookie(SESSION_COOKIE_NAME, '/')
  // Fire-and-forget: clear the HttpOnly scopery_token cookie server-side.
  // Used on 401 auto-logout; logout flow uses the proxy endpoint directly.
  void fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {})
}

function parseProblemDetails(body: unknown, status: number): ProblemDetails {
  if (body && typeof body === 'object' && 'status' in body) {
    const b = body as Record<string, unknown>
    return {
      type: String(b.type ?? 'about:blank'),
      title: String(b.title ?? 'Error'),
      status: Number(b.status ?? status),
      detail: String(b.detail ?? ''),
      instance: b.instance != null ? String(b.instance) : undefined,
      request_id: b.request_id != null ? String(b.request_id) : undefined,
      code: b.code != null ? String(b.code) : undefined,
      errors: Array.isArray(b.errors)
        ? (b.errors as Array<{ path?: string; message?: string }>).map((e) => ({
            path: String(e.path ?? ''),
            message: String(e.message ?? ''),
          }))
        : undefined,
    }
  }
  return {
    type: 'about:blank',
    title: 'Request failed',
    status,
    detail: typeof body === 'object' && body !== null && 'detail' in body ? String((body as Record<string, unknown>).detail) : `HTTP ${status}`,
  }
}

export type ApiRequestInit = RequestInit & { parseJson?: boolean; skipAuthRedirect?: boolean }

/**
 * Client-side: rewrite external BE URLs to /api/proxy/* so the Next.js BFF
 * can inject the HttpOnly scopery_token as an Authorization header.
 * Server-side (SSR / Route Handlers): leave URL unchanged.
 */
function toProxyUrl(url: string): string {
  if (typeof window === 'undefined') return url
  const base = getApiBaseUrl()
  const prefix = base + '/api/'
  if (base && url.startsWith(prefix)) {
    return '/api/proxy/' + url.slice(prefix.length)
  }
  return url
}

async function request<T>(url: string, options: ApiRequestInit = {}): Promise<T> {
  const { parseJson = true, skipAuthRedirect, ...init } = options

  // ── Mock mode intercept ─────────────────────────────────────────────────
  if (isMockMode) {
    const method = (init.method ?? 'GET').toUpperCase()
    let body: unknown
    try {
      body = init.body ? JSON.parse(init.body as string) : undefined
    } catch {
      body = undefined
    }
    const mockResult = resolveMock(url, method, body)
    if (mockResult !== undefined) {
      // Simulate realistic network latency
      await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
      if (!parseJson) return undefined as T
      return mockResult as T
    }
    // For unmatched routes in mock mode, log a warning and return empty/null
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[mock] No mock registered for ${method} ${url}`)
    }
    await new Promise<void>((resolve) => setTimeout(resolve, MOCK_DELAY_MS))
    return undefined as T
  }
  // ── End mock mode intercept ─────────────────────────────────────────────

  const proxyUrl = toProxyUrl(url)
  const isProxied = proxyUrl !== url

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  // Authorization is added by the proxy on proxied requests.
  // For direct calls (SSR / non-API URLs), fall back to cookie token.
  if (!isProxied) {
    const token = getAccessToken()
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(proxyUrl, { ...init, headers })

  if (!res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    const isProblemJson = contentType.includes('application/problem+json')
    let body: unknown
    try {
      const text = await res.text()
      body = text ? JSON.parse(text) : {}
    } catch {
      body = {}
    }
    const problem = parseProblemDetails(isProblemJson ? body : {}, res.status)
    const err = new ApiError(res.status, problem)
    if (err.isAuthError && typeof window !== 'undefined' && !skipAuthRedirect) {
      clearSessionStorage()
      const path = window.location.pathname || ''
      const returnTo =
        path && !path.startsWith(TOKEN_PATH_PREFIX)
          ? `${LOGIN_PATH}?returnTo=${encodeURIComponent(path)}`
          : LOGIN_PATH
      window.location.href = returnTo
    }
    throw err
  }

  if (!parseJson) {
    return undefined as T
  }

  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

/** Base URL for v2 API (no trailing slash). Prefers NEXT_PUBLIC_API_URL, then NEXT_PUBLIC_API_BASE_URL. */
export function getApiBaseUrl(): string {
  if (typeof process === 'undefined') return ''
  const url = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  return typeof url === 'string' ? url : ''
}

export const apiClient = {
  get: <T>(url: string, init?: ApiRequestInit) => request<T>(url, { ...init, method: 'GET' }),

  post: <T>(url: string, data?: unknown, init?: ApiRequestInit) =>
    request<T>(url, { ...init, method: 'POST', body: data ? JSON.stringify(data) : undefined }),

  put: <T>(url: string, data?: unknown, init?: ApiRequestInit) =>
    request<T>(url, { ...init, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),

  patch: <T>(url: string, data?: unknown, init?: ApiRequestInit) =>
    request<T>(url, { ...init, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),

  delete: <T>(url: string, init?: ApiRequestInit) => request<T>(url, { ...init, method: 'DELETE' }),
}
