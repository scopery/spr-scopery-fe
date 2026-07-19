/**
 * Portal API client — separate session boundary from internal apiClient.
 * Redirects to /portal/login on auth failure; never shares internal cache keys.
 */

import type { ProblemDetails } from '@/shared/lib/api-types'
import { ApiError } from '@/shared/lib/api-types'
import type { ApiRequestInit } from '@/shared/lib/apiInterceptors'

const PORTAL_LOGIN_PATH = '/portal/login'

function parseProblemDetails(body: unknown, status: number): ProblemDetails {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    if (b.success === false) {
      return {
        type: 'about:blank',
        title: String(b.error ?? 'Error'),
        status: Number(b.status ?? status),
        detail: String(b.message ?? `HTTP ${status}`),
        code: b.errorCode != null ? String(b.errorCode) : undefined,
      }
    }
    if ('status' in b || 'title' in b) {
      return {
        type: String(b.type ?? 'about:blank'),
        title: String(b.title ?? 'Error'),
        status: Number(b.status ?? status),
        detail: String(b.detail ?? ''),
        code: b.code != null ? String(b.code) : undefined,
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

async function portalRequest<T>(
  url: string,
  options: ApiRequestInit = {}
): Promise<T> {
  const { parseJson = true, skipAuthRedirect, ...init } = options
  const method = (init.method ?? 'GET').toUpperCase()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Scopery-Client': 'portal',
    ...(init.headers as Record<string, string>),
  }

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })

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

    if (err.isAuthError && typeof window !== 'undefined' && !skipAuthRedirect) {
      const path = window.location.pathname || ''
      const returnTo =
        path.startsWith('/portal') && path !== PORTAL_LOGIN_PATH
          ? `${PORTAL_LOGIN_PATH}?returnTo=${encodeURIComponent(path)}`
          : PORTAL_LOGIN_PATH
      window.location.href = returnTo
    }
    throw err
  }

  if (!parseJson) return undefined as T

  const text = await res.text()
  if (!text) return undefined as T
  const jsonData = JSON.parse(text) as unknown

  if (
    typeof jsonData === 'object' &&
    jsonData !== null &&
    'success' in jsonData &&
    (jsonData as { success: boolean }).success === true &&
    'data' in jsonData
  ) {
    return (jsonData as { data: T }).data
  }

  return jsonData as T
}

export const portalApiClient = {
  get: <T>(url: string, init?: ApiRequestInit) =>
    portalRequest<T>(url, { ...init, method: 'GET' }),

  post: <T>(url: string, data?: unknown, init?: ApiRequestInit) =>
    portalRequest<T>(url, {
      ...init,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: unknown, init?: ApiRequestInit) =>
    portalRequest<T>(url, {
      ...init,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(url: string, data?: unknown, init?: ApiRequestInit) =>
    portalRequest<T>(url, {
      ...init,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string, init?: ApiRequestInit) =>
    portalRequest<T>(url, { ...init, method: 'DELETE' }),
}
