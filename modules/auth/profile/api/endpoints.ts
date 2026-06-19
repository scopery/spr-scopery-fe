import { v2 } from '@/shared/lib/api-paths'

export const PROFILE_ENDPOINTS = {
  getProfile: () => v2('/profile'),
  updateProfile: () => v2('/profile'),
  uploadAvatar: () => v2('/profile/avatar'),
} as const
