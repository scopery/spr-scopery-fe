import { AUTH_ENDPOINTS } from '../../endpoints'
import { apiClient, setSessionStorage, clearSessionStorage } from '@/shared/lib/apiClient'
import type { AuthSession, LoginPayload, RegisterPayload } from '../model/auth'
import * as authSessionApi from './auth-session.api'

export type { AuthSession, LoginPayload, RegisterPayload } from '../model/auth'

/** Shape returned by POST /api/iam/auth/login and POST /api/iam/auth/refresh */
interface BeLoginResponse {
  userId: string
  username: string
  email: string
  fullName: string
}

/** Request body for POST /api/iam/users */
interface BeRegisterRequest {
  username: string
  email: string
  fullName: string
  password: string
}

function normalizeSession(res: BeLoginResponse): AuthSession {
  setSessionStorage({
    user: {
      id: res.userId,
      username: res.username,
      email: res.email,
      fullName: res.fullName,
    },
  })
  return {
    user: { id: res.userId, username: res.username, email: res.email, fullName: res.fullName },
    session: { access_token: '' }, // HttpOnly cookie — not readable by JS
  }
}

export async function login(payload: LoginPayload): Promise<AuthSession> {
  const res = await apiClient.post<BeLoginResponse>(AUTH_ENDPOINTS.login(), payload, {
    skipAuthRedirect: true,
  })
  return normalizeSession(res)
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post(AUTH_ENDPOINTS.logout(), undefined, { parseJson: false })
  } catch {
    // ignore network/auth errors on logout
  }
  clearSessionStorage()
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  const body: BeRegisterRequest = {
    username: payload.username,
    email: payload.email,
    fullName: payload.fullName,
    password: payload.password,
  }
  await apiClient.post<void>(AUTH_ENDPOINTS.register(), body, {
    skipAuthRedirect: true,
    parseJson: false,
  })
  return login({ username: payload.username, password: payload.password })
}

export async function requestPasswordReset(email: string): Promise<void> {
  await authSessionApi.requestPasswordReset({ email })
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  await authSessionApi.confirmPasswordReset({ token, newPassword })
}

export async function loginWithGoogle(): Promise<void> {
  throw new Error('Google sign-in is not yet available')
}
