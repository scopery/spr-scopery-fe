import { PROFILE_ENDPOINTS } from '../../endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { Profile, UserProfile } from '@/modules/auth/auth/model/auth'
import type { IamMe } from '@/modules/auth/iam/model'

export type { Profile, UserProfile } from '@/modules/auth/auth/model/auth'

function mapMeToProfile(me: IamMe): Profile {
  const status = me.status?.toLowerCase() === 'suspended' ? 'suspended' : 'active'
  return {
    user_id: me.id,
    email: me.email,
    display_name: me.fullName?.trim() || me.username,
    avatar_url: null,
    role: 'user',
    status,
    default_org_id: me.organizationMemberships[0]?.organizationId ?? null,
    created_at: me.createdAt,
    updated_at: me.createdAt,
  }
}

export function normalizeProfile(raw: Profile): UserProfile {
  return {
    displayName: raw.display_name,
    avatarUrl: raw.avatar_url ?? undefined,
    role: raw.role,
    status: raw.status,
    defaultOrgId: raw.default_org_id,
  }
}

export async function getProfile(): Promise<Profile> {
  const me = await apiClient.get<IamMe>(PROFILE_ENDPOINTS.getProfile())
  return mapMeToProfile(me)
}

export async function updateProfile(patch: {
  display_name?: string
  avatar_url?: string
}): Promise<Profile> {
  const current = await getProfile()
  if (patch.display_name) {
    await apiClient.put(PROFILE_ENDPOINTS.updateProfile(current.user_id), {
      fullName: patch.display_name,
    })
  }
  return getProfile()
}

export async function uploadAvatar(_file: File): Promise<{ public_url: string }> {
  throw new Error('Avatar upload is not available yet')
}
