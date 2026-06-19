import { ApiError, getProblemCode } from '@/shared/lib/api-types'

export const JOIN_INVITE_ERROR_BY_CODE: Record<string, string> = {
  INVITE_EXPIRED: 'Invite expired. Ask owner to resend.',
  INVITE_INVALID: 'Invite invalid. Check the link/token.',
  INVITE_EMAIL_MISMATCH: 'This invite was sent to a different email.',
  ALREADY_ACCEPTED: 'Invite already used.',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
}

export function getJoinErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const code = getProblemCode(err)
    if (code && JOIN_INVITE_ERROR_BY_CODE[code]) return JOIN_INVITE_ERROR_BY_CODE[code]
    if (err.status === 403) return "You don't have permission to use this invite."
    return err.problem.detail || 'Failed to join organization.'
  }
  return err instanceof Error ? err.message : 'Failed to join organization.'
}
