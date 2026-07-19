import { apiClient } from '@/shared/lib/apiClient'
import { ACCESS_ENDPOINTS } from '../../endpoints'
import type { EffectivePermissions } from '../model/permissions-types'

export async function getEffectivePermissions(
  orgId: string,
  projectId?: string
): Promise<EffectivePermissions> {
  // Legacy org-scoped path — not on current BE. Callers use role fallbacks.
  const url = ACCESS_ENDPOINTS.effectivePermissions(orgId, projectId)
  const res = await apiClient.get<{ ok: boolean; data: EffectivePermissions }>(url, {
    skipErrorToast: true,
  })
  return res.data
}
