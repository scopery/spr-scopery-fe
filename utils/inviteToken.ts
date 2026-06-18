/**
 * Invite token parsing and pending_invite_token sessionStorage.
 * Do not log or send token to analytics/monitoring; if needed mask as "abc…xyz".
 */

const PENDING_INVITE_TOKEN_KEY = 'pending_invite_token'

/** Token must be safe chars, min length to avoid junk; max for sanity. */
const TOKEN_REGEX = /^[A-Za-z0-9_-]{12,512}$/

export function getPendingInviteToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(PENDING_INVITE_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setPendingInviteToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(PENDING_INVITE_TOKEN_KEY, token)
  } catch {
    // ignore
  }
}

export function clearPendingInviteToken(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY)
  } catch {
    // ignore
  }
}

/**
 * Parse user input (link or raw token) into a single token string.
 * - Trim; if input contains /invites/ take segment after last /invites/; strip query/hash.
 * - Validate: non-empty, no weird whitespace, match safe regex.
 * @throws Error with message suitable for UI (422-style validation).
 */
export function parseInviteToken(input: string): string {
  const raw = typeof input === 'string' ? input : ''
  const trimmed = raw.trim()

  if (!trimmed) {
    throw new Error('Please enter an invite link or token.')
  }

  if (/\s/.test(trimmed)) {
    throw new Error('Invite link or token should not contain spaces.')
  }

  let token = trimmed

  if (trimmed.includes('/invites/')) {
    const idx = trimmed.lastIndexOf('/invites/')
    const after = trimmed.slice(idx + '/invites/'.length)
    const segment = after.split(/[?#]/)[0].trim()
    if (segment) token = segment
  } else {
    const beforeQuery = trimmed.split(/[?#]/)[0].trim()
    if (beforeQuery) token = beforeQuery
  }

  if (!token) {
    throw new Error('Could not find invite token in the link.')
  }

  if (!TOKEN_REGEX.test(token)) {
    throw new Error('Invite token format is invalid. Paste the full link or token.')
  }

  return token
}
