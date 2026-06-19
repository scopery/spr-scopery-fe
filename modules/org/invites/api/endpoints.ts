import { v2 } from '@/shared/lib/api-paths'

export const ORG_INVITE_ENDPOINTS = {
  accept: () => v2('/org-invites/accept'),
} as const
