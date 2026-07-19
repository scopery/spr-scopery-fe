/**
 * Full logout of client + HttpOnly auth cookies, then hard-nav to login.
 * Use on 401 / expired session so middleware won't bounce protected routes.
 */
import { SCOPERY_SESSION_COOKIE } from '@/shared/lib/auth-cookies'

const LOGIN_PATH = '/auth/login'
const TOKEN_PATH_PREFIX = '/invites/'

function deleteClientSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie =
    encodeURIComponent(SCOPERY_SESSION_COOKIE) + '=; path=/; max-age=0; SameSite=Lax'
}

async function clearHttpOnlyAuthCookies(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
  } catch {
    // best-effort — still redirect
  }
}

export function buildLoginUrl(returnPath?: string | null): string {
  const path = returnPath ?? (typeof window !== 'undefined' ? window.location.pathname : '')
  if (path && !path.startsWith(TOKEN_PATH_PREFIX) && !path.startsWith('/auth')) {
    return `${LOGIN_PATH}?returnTo=${encodeURIComponent(path)}`
  }
  return LOGIN_PATH
}

/**
 * Clears session cookies (client + HttpOnly) and redirects to login.
 * Safe to call multiple times; uses location.replace to avoid back-stack loops.
 */
export async function redirectToLogin(opts?: {
  returnPath?: string | null
  /** When true, skip if already on an auth page */
  skipIfOnAuthPage?: boolean
}): Promise<void> {
  if (typeof window === 'undefined') return
  const path = window.location.pathname || ''
  if (opts?.skipIfOnAuthPage && path.startsWith('/auth')) return

  deleteClientSessionCookie()
  await clearHttpOnlyAuthCookies()

  const loginUrl = buildLoginUrl(opts?.returnPath ?? path)
  window.location.replace(loginUrl)
}
