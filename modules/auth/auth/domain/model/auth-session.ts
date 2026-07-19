export interface AuthSessionItem {
  id: string
  deviceName?: string
  userAgent?: string
  ipAddress?: string
  status: string
  current?: boolean
  createdAt: string
  lastActiveAt?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface PasswordResetRequestPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  token: string
  newPassword: string
}

export interface EmailVerificationConfirmPayload {
  token: string
}

export interface EmailVerificationSendPayload {
  email: string
}
