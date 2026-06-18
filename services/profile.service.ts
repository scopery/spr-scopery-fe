/**
 * Profile service — v2 API.
 * GET /api/v2/profile returns profile object directly (no ok/data envelope).
 */

import { PROFILE_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type { Profile, UserProfile } from '@/types/auth'

function normalizeProfile(raw: Profile): UserProfile {
  return {
    displayName: raw.display_name,
    avatarUrl: raw.avatar_url ?? undefined,
    role: raw.role,
    status: raw.status,
    defaultOrgId: raw.default_org_id,
  }
}

export async function getProfile(): Promise<Profile> {
  const url = PROFILE_ENDPOINTS.getProfile()
  return apiClient.get<Profile>(url)
}

export async function updateProfile(patch: { display_name?: string; avatar_url?: string }): Promise<Profile> {
  const url = PROFILE_ENDPOINTS.updateProfile()
  return apiClient.patch<Profile>(url, patch)
}

export async function uploadAvatar(file: File): Promise<{ public_url: string }> {
  const { getAccessToken } = await import('@/shared/lib/apiClient')
  const token = getAccessToken()
  const res = await fetch(PROFILE_ENDPOINTS.uploadAvatar(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      file_name: file.name,
      mime_type: file.type,
    }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string; title?: string }
    throw new Error(body.detail ?? body.title ?? 'Upload failed')
  }
  const data = (await res.json()) as { signed_url: string; object_path: string; expires_at: string; public_url: string }
  await fetch(data.signed_url, { method: 'PUT', body: file })
  await updateProfile({ avatar_url: data.public_url })
  return { public_url: data.public_url }
}

export { normalizeProfile }
