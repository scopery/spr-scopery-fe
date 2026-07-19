/**
 * API URL builder — mirrors BE `ApiPaths.BASE_PATH = "/api"` (unversioned).
 *
 * Callers pass **resource paths only** (no `/api`, no version):
 *   apiPath('/iam/auth/login')
 *   apiPath(`/workspaces/${id}/trust/dashboard`)
 *
 * Origin (`NEXT_PUBLIC_API_URL`) is empty in local/dev so the browser uses
 * same-origin `/api/...` and Next rewrites to `API_INTERNAL_URL`.
 * Next BFF routes (`/api/auth/*`, `/api/proxy/*`) take precedence over the rewrite.
 */

/** Matches BE `com.company.scopery.common.constant.ApiPaths.BASE_PATH`. */
export const API_BASE_PATH = '/api' as const

/** Browser/server origin for the API. Empty → relative URLs (Next proxy). */
export function getApiOrigin(): string {
  if (typeof process === 'undefined') return ''
  const url = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  return typeof url === 'string' ? url.replace(/\/$/, '') : ''
}

/** @deprecated Prefer `getApiOrigin()` — kept for existing imports. */
export const getApiBaseUrl = getApiOrigin

function normalizeResourcePath(resourcePath: string): string {
  if (!resourcePath) return ''
  return resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`
}

/**
 * Build an API URL under `/api`.
 *
 * @example
 * apiPath('/iam/auth/login')                    // → /api/iam/auth/login
 * apiPath(`/workspaces/${id}/applications`)     // → /api/workspaces/.../applications
 */
export function apiPath(resourcePath: string): string {
  return `${getApiOrigin()}${API_BASE_PATH}${normalizeResourcePath(resourcePath)}`
}
