import { v2 } from '@/shared/lib/api-paths'

export const AUTH_ENDPOINTS = {
  login: () => v2('/auth/login'),
  register: () => v2('/auth/register'),
  logout: () => v2('/auth/logout'),
  forgotPassword: () => v2('/auth/forgot-password'),
  google: (redirectTo?: string) => {
    const url = v2('/auth/google')
    if (redirectTo) return `${url}?redirectTo=${encodeURIComponent(redirectTo)}`
    return url
  },
  me: () => v2('/auth/me'),
  updateMe: () => v2('/auth/me'),
} as const
