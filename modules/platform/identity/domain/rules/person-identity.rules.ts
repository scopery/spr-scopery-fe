import type { PersonIdentity } from '../model/person-identity'

/** Compatibility fallback that never exposes a technical user identifier. */
export function shortUserId(userId: string | null | undefined): string {
  if (!userId) return '—'
  return '—'
}

export function personInitials(nameOrId: string): string {
  const trimmed = nameOrId.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

/** Primary label for selects / lists. Prefer name → email → username. */
export function formatPersonLabel(
  person: PersonIdentity | null | undefined,
  userId: string,
  opts?: { currentUserId?: string | null; youLabel?: string }
): string {
  if (opts?.currentUserId && userId === opts.currentUserId) {
    const base =
      person?.fullName?.trim() ||
      person?.email?.trim() ||
      person?.username?.trim() ||
      opts.youLabel ||
      'You'
    return base === 'You' || base === opts.youLabel ? base : `You — ${base}`
  }
  const name = person?.fullName?.trim()
  if (name) return name
  const email = person?.email?.trim()
  if (email) return email
  const username = person?.username?.trim()
  if (username) return username
  return shortUserId(userId)
}

export function mapIamUserToPerson(user: {
  id: string
  fullName: string
  email: string
  username: string
}): PersonIdentity {
  return {
    id: user.id,
    fullName: user.fullName?.trim() || user.username || user.email || '—',
    email: user.email || null,
    username: user.username || null,
    avatarUrl: null,
  }
}
