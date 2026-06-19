import { apiClient } from '@/shared/lib/apiClient'
import type { EffectivePermissions } from '../model/permissions-types'

const v2 = (path: string) => {
  const base =
    typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
      : ''
  return `${base}/api/v2${path}`
}

export async function getEffectivePermissions(
  orgId: string,
  projectId?: string
): Promise<EffectivePermissions> {
  const params = new URLSearchParams()
  if (projectId) params.set('projectId', projectId)
  const q = params.toString()
  const url = v2(`/orgs/${orgId}/access/effective-permissions`) + (q ? `?${q}` : '')
  const res = await apiClient.get<{ ok: boolean; data: EffectivePermissions }>(url)
  return res.data
}
