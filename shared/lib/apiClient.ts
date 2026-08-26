/**
 * API client
 * - Requests use `credentials: 'include'` — browser sends HttpOnly auth cookies automatically.
 * - CSRF: reads `XSRF-TOKEN` cookie → sends `X-XSRF-TOKEN` header on all mutating requests
 *   (except `/api/iam/auth/` endpoints which are exempt per BE spec).
 * - Success: unwraps `{ success: true, data }` envelope if present, otherwise returns body directly.
 * - Error: parses BE error format `{ success: false, ... }` or RFC 9457, throws ApiError.
 * - On 401: attempts refresh once via POST /api/iam/auth/refresh, retries original request.
 *   If refresh also fails, clears session and redirects to login.
 *
 * Mock mode (NEXT_PUBLIC_DATA_MODE=mock):
 *   Every request is intercepted before fetch(). The mock resolver maps the URL
 *   to fixture data from mocks/resolver.ts. No real network calls are made.
 *   Auth bootstrap is satisfied by seeding a mock session cookie on first load.
 */

import type { ProblemDetails } from '@/shared/lib/api-types'
import { ApiError } from '@/shared/lib/api-types'
import { apiPath } from '@/shared/lib/api-paths'
import {
  runErrorInterceptors,
  runRequestInterceptors,
  runResponseInterceptors,
  type ApiRequestInit,
} from '@/shared/lib/apiInterceptors'
import { SCOPERY_SESSION_COOKIE } from '@/shared/lib/auth-cookies'
import { trackGlobalLoading } from '@/shared/lib/globalLoading'
import { buildLoginUrl, redirectToLogin } from '@/shared/lib/redirectToLogin'

export type { ApiRequestInit } from '@/shared/lib/apiInterceptors'
export { getApiBaseUrl } from '@/shared/lib/api-paths'

/** Path prefix for auth endpoints — CSRF-exempt per BE spec */
const AUTH_IAM_PREFIX = '/iam/auth/'

// Refresh goes through BFF proxy so it can re-inject the refresh_token cookie
// and update scopery_token / access_token cookies on success.
const getAuthRefreshUrl = () => '/api/proxy/iam/auth/refresh'

const SESSION_COOKIE_NAME = SCOPERY_SESSION_COOKIE
/** 7 days in seconds */
const SESSION_MAX_AGE = 7 * 24 * 60 * 60
const DEBUG_API_LOG_KEY = 'scopery_debug_api_logs'
const DEBUG_API_LOG_LIMIT = 100

function shouldPersistApiDebugLogs(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG_API === '1'
}

function persistApiDebugLog(entry: Record<string, unknown>): void {
  if (!shouldPersistApiDebugLogs() || typeof window === 'undefined') return

  const nextEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
  }

  try {
    const raw = window.localStorage.getItem(DEBUG_API_LOG_KEY)
    const logs = raw ? (JSON.parse(raw) as unknown[]) : []
    logs.push(nextEntry)
    window.localStorage.setItem(DEBUG_API_LOG_KEY, JSON.stringify(logs.slice(-DEBUG_API_LOG_LIMIT)))
  } catch {
    // Debug logging must never affect application behavior.
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[api-debug]', nextEntry)
  }
}

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
  options: {
    maxAge?: number
    path?: string
    secure?: boolean
    sameSite?: 'Lax' | 'Strict' | 'None'
  } = {}
): void {
  if (typeof document === 'undefined') return
  const { maxAge = SESSION_MAX_AGE, path = '/', sameSite = 'Lax' } = options
  const secure =
    options.secure ?? (typeof window !== 'undefined' && window.location?.protocol === 'https:')
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
export function getSessionFromCookie(): {
  accessToken?: string
  refreshToken?: string
  user: unknown
} | null {
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
  // BE HttpOnly cookies (access_token, refresh_token) are cleared server-side by the logout endpoint.
}

/** Read the XSRF-TOKEN cookie value (set by BE on first request, not HttpOnly). */
function getCsrfToken(): string | null {
  return getCookie('XSRF-TOKEN')
}

async function waitForCsrfToken(maxAttempts = 10): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = getCsrfToken()
    if (token) return token
    await new Promise((resolve) => setTimeout(resolve, 16 * (attempt + 1)))
  }
  return getCsrfToken()
}

let csrfPrimePromise: Promise<void> | null = null

// Shared promise — prevents concurrent 401 responses from each starting their own
// refresh call. The BE rotates the refresh token on use, so only one call can
// succeed; any second simultaneous call would revoke the already-rotated token and
// redirect the user to login. All in-flight 401 handlers wait for the same promise.
let activeRefreshPromise: Promise<boolean> | null = null

function performRefresh(originalMethod: string, originalUrl: string, skipAuthRedirect: boolean): Promise<boolean> {
  if (!activeRefreshPromise) {
    activeRefreshPromise = (async () => {
      try {
        const refreshRes = await fetch(getAuthRefreshUrl(), {
          method: 'POST',
          credentials: 'include',
        })
        persistApiDebugLog({
          event: refreshRes.ok ? 'auth_refresh_ok' : 'auth_refresh_failed',
          method: 'POST',
          url: getAuthRefreshUrl(),
          status: refreshRes.status,
          originalMethod,
          originalUrl,
          skipAuthRedirect,
        })
        return refreshRes.ok
      } catch {
        persistApiDebugLog({
          event: 'auth_refresh_network_error',
          method: 'POST',
          url: getAuthRefreshUrl(),
          originalMethod,
          originalUrl,
          skipAuthRedirect,
        })
        return false
      } finally {
        activeRefreshPromise = null
      }
    })()
  }
  return activeRefreshPromise
}

/** Prime CSRF cookie via a safe GET before the first mutating request in a session. */
export async function ensureCsrfToken(): Promise<void> {
  if (getCsrfToken()) return
  if (!csrfPrimePromise) {
    csrfPrimePromise = (async () => {
      await fetch(apiPath('/workspace-context/current'), {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      await waitForCsrfToken()
    })().finally(() => {
      csrfPrimePromise = null
    })
  }
  await csrfPrimePromise
}

/** Returns true when the request method + URL requires the X-XSRF-TOKEN header. */
function needsCsrf(method: string, url: string): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) return false
  return !url.includes(AUTH_IAM_PREFIX)
}

function parseProblemDetails(body: unknown, status: number): ProblemDetails {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>

    // BE format: { success: false, status, error, errorCode, message, details }
    if (b.success === false) {
      return {
        type: 'about:blank',
        title: String(b.error ?? 'Error'),
        status: Number(b.status ?? status),
        detail: String(b.message ?? `HTTP ${status}`),
        code: b.errorCode != null ? String(b.errorCode) : undefined,
        errors: Array.isArray(b.details)
          ? (b.details as unknown[]).map((d) => ({ path: '', message: String(d) }))
          : undefined,
      }
    }

    // RFC 9457 problem+json format (v2 legacy)
    if ('status' in b || 'title' in b) {
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
  }
  return {
    type: 'about:blank',
    title: 'Request failed',
    status,
    detail: `HTTP ${status}`,
  }
}

async function request<T>(url: string, options: ApiRequestInit = {}, _isRetry = false): Promise<T> {
  const ctx = await runRequestInterceptors({ url, init: options })
  const { parseJson = true, skipAuthRedirect, skipGlobalLoading, ...init } = ctx.init

  const endLoading = trackGlobalLoading(!skipGlobalLoading)

  try {
    const method = (init.method ?? 'GET').toUpperCase()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string>),
    }

    if (needsCsrf(method, ctx.url)) {
      await ensureCsrfToken()
      const csrf = getCsrfToken()
      if (csrf) headers['X-XSRF-TOKEN'] = csrf
    }

    const res = await fetch(ctx.url, { ...init, headers, credentials: 'include' })

    if (!res.ok) {
      let body: unknown
      try {
        const text = await res.text()
        body = text ? JSON.parse(text) : {}
      } catch {
        body = {}
      }
      const problem = parseProblemDetails(body, res.status)
      const err = new ApiError(res.status, problem)
      persistApiDebugLog({
        event: 'api_error',
        method,
        url: ctx.url,
        status: res.status,
        problem,
        skipAuthRedirect: Boolean(skipAuthRedirect),
        isRetry: _isRetry,
      })

      // 401: attempt refresh once, then retry the original request.
      // skipAuthRedirect only suppresses the final navigation to login; it should not
      // prevent recoverable auth errors from refreshing during onboarding flows.
      // CSRF token may lag behind the first GET in a session — prime once and retry.
      if (err.status === 403 && !_isRetry && needsCsrf(method, ctx.url)) {
        await ensureCsrfToken()
        return request<T>(url, options, true)
      }

      if (err.isAuthError && !_isRetry && !ctx.url.includes(AUTH_IAM_PREFIX)) {
        const refreshed = await performRefresh(method, ctx.url, Boolean(skipAuthRedirect))
        if (refreshed) {
          await ensureCsrfToken()
          return request<T>(url, options, true)
        }
      }

      if (err.isAuthError && typeof window !== 'undefined' && !skipAuthRedirect) {
        clearSessionStorage()
        const path = window.location.pathname || ''
        const returnTo = buildLoginUrl(path)
        persistApiDebugLog({
          event: 'auth_redirect_login',
          method,
          url: ctx.url,
          status: err.status,
          returnTo,
        })
        // Clear HttpOnly token then hard-nav — avoids middleware bounce with stale cookies
        void redirectToLogin({ returnPath: path })
      }
      throw err
    }

    if (!parseJson) {
      return undefined as T
    }

    const text = await res.text()
    if (!text) return undefined as T
    const jsonData = JSON.parse(text) as unknown

    // Unwrap { success: true, data } envelope
    if (
      typeof jsonData === 'object' &&
      jsonData !== null &&
      'success' in jsonData &&
      (jsonData as { success: boolean }).success === true &&
      'data' in jsonData
    ) {
      return runResponseInterceptors(ctx, (jsonData as { data: T }).data)
    }

    return runResponseInterceptors(ctx, jsonData as T)
  } catch (error) {
    throw await runErrorInterceptors(ctx, error)
  } finally {
    endLoading()
  }
}

/** API client — use relative `/api/...` paths from `apiPath()`; BFF proxy adds auth. */
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
