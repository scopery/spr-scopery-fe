import { apiClient } from '@/shared/lib/apiClient'
import { AUTH_ENDPOINTS } from '../../endpoints'
import type {
  AuthSessionItem,
  ChangePasswordPayload,
  EmailVerificationConfirmPayload,
  EmailVerificationSendPayload,
  PasswordResetConfirmPayload,
  PasswordResetRequestPayload,
} from '../domain/model/auth-session'

export async function requestPasswordReset(body: PasswordResetRequestPayload): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.passwordResetRequest(), body, {
    skipAuthRedirect: true,
    parseJson: false,
  })
}

export async function confirmPasswordReset(body: PasswordResetConfirmPayload): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.passwordResetConfirm(), body, {
    skipAuthRedirect: true,
    parseJson: false,
  })
}

export async function changePassword(body: ChangePasswordPayload): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.passwordChange(), body, { parseJson: false })
}

export async function confirmEmailVerification(
  body: EmailVerificationConfirmPayload
): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.emailVerificationConfirm(), body, {
    skipAuthRedirect: true,
    parseJson: false,
  })
}

export async function sendEmailVerification(body: EmailVerificationSendPayload): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.emailVerificationSend(), body, {
    skipAuthRedirect: true,
    parseJson: false,
  })
}

export async function listSessions(): Promise<AuthSessionItem[]> {
  // BE only exposes revoke-all — no list sessions endpoint yet.
  try {
    return await apiClient.get<AuthSessionItem[]>(AUTH_ENDPOINTS.sessions(), {
      skipErrorToast: true,
    })
  } catch {
    return []
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.revokeSession(sessionId), undefined, {
    parseJson: false,
  })
}

export async function revokeAllSessions(): Promise<void> {
  await apiClient.post<void>(AUTH_ENDPOINTS.revokeAllSessions(), undefined, { parseJson: false })
}
