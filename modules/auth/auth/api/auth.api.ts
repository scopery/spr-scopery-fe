import { AUTH_ENDPOINTS } from './endpoints'
import { apiClient, setSessionStorage, clearSessionStorage } from '@/shared/lib/apiClient'
import type { AuthSession, LoginPayload, RegisterPayload } from '../model/auth'

export type { AuthSession, LoginPayload, RegisterPayload } from '../model/auth'

type BeAuthResponse = { access_token: string; user?: unknown; profile?: unknown }

function normalizeSession(apiRes: BeAuthResponse): AuthSession {
  const accessToken = apiRes.access_token
  if (!accessToken) throw new Error('No access_token in response')
  const user = apiRes.user as { id?: string; email?: string; display_name?: string } | undefined
  setSessionStorage({
    access_token: accessToken,
    user: { id: user?.id ?? '', email: user?.email ?? '', display_name: user?.display_name },
  })
  return {
    user: { id: user?.id ?? '', email: user?.email ?? '', display_name: user?.display_name },
    session: { access_token: accessToken },
  }
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const url = AUTH_ENDPOINTS.register()
  const res = await apiClient.post<BeAuthResponse>(
    url,
    {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name,
    },
    { skipAuthRedirect: true }
  )
  return normalizeSession(res)
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const url = AUTH_ENDPOINTS.login()
  const res = await apiClient.post<BeAuthResponse>(url, payload, { skipAuthRedirect: true })
  return normalizeSession(res)
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post(AUTH_ENDPOINTS.forgotPassword(), { email })
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post(AUTH_ENDPOINTS.logout(), {})
  } catch {
    // ignore network/401
  }
  clearSessionStorage()
}

export async function loginWithGoogle(): Promise<void> {
  if (typeof window === 'undefined') return
  const redirectTo = `${window.location.origin}/auth/callback`
  const url = AUTH_ENDPOINTS.google(redirectTo)
  const res = await apiClient.get<{ url: string }>(url)
  if (res?.url) {
    window.location.href = res.url
  } else {
    throw new Error('No Google OAuth URL returned')
  }
}
