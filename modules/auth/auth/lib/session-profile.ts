import type { AuthSession, Profile } from '../model/auth-types'

export function buildSessionProfile(
  session: AuthSession,
  isSuperAdmin: boolean,
  currentWorkspaceId: string | null
): Profile {
  return {
    user_id: session.user.id,
    email: session.user.email,
    display_name: session.user.fullName?.trim() || session.user.username,
    avatar_url: null,
    role: isSuperAdmin ? 'admin' : 'user',
    status: 'active',
    default_org_id: currentWorkspaceId,
    created_at: '',
    updated_at: '',
  }
}
