/**
 * Auth, Profile and domain types
 */

export interface RegisterPayload {
  username: string
  email: string
  password: string
  fullName: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  email: string
  fullName?: string
}

export interface AuthSession {
  user: AuthUser
  /** access_token is an HttpOnly cookie managed by the BE — empty string here. */
  session: {
    access_token: string
    refresh_token?: string
  }
}

/** User role (profile) — platform role */
export type ProfileRole = 'admin' | 'user'

/** Profile status */
export type ProfileStatus = 'active' | 'suspended'

export interface Profile {
  user_id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: ProfileRole
  status: ProfileStatus
  default_org_id: string | null
  created_at: string
  updated_at: string
}

export const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh' as const

/** Legacy compat — normalize to display fields */
export interface UserProfile {
  displayName: string
  timezone?: string
  avatarUrl?: string
  role: ProfileRole
  status?: ProfileStatus
  defaultOrgId?: string | null
}
