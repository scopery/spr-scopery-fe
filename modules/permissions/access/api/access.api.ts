import { apiClient } from '@/shared/lib/apiClient'
import { ACCESS_ENDPOINTS } from '../../endpoints'
import type { EffectivePermissions } from '../model/permissions-types'

export async function getEffectivePermissions(
  orgId?: string,
  projectId?: string
): Promise<EffectivePermissions | null> {
  const url = ACCESS_ENDPOINTS.effectivePermissions(orgId, projectId)
  try {
    const res = await apiClient.get<EffectivePermissions>(url, { skipErrorToast: true })
    if (!res?.permissions) return null
    return res
  } catch {
    return null
  }
}
