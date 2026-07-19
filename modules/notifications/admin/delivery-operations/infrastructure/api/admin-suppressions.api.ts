import { apiClient } from '@/shared/lib/apiClient'
import { ADMIN_DELIVERY_ENDPOINTS } from './endpoints'
import type { AdminSuppression } from '../../domain/model/admin-suppression'

export interface ListAdminSuppressionsParams {
  userId?: string
  channel?: string
}

export async function listAdminSuppressions(
  params?: ListAdminSuppressionsParams
): Promise<AdminSuppression[]> {
  const p = new URLSearchParams()
  if (params?.userId) p.set('userId', params.userId)
  if (params?.channel) p.set('channel', params.channel)
  const q = p.toString()
  const url = ADMIN_DELIVERY_ENDPOINTS.suppressions.list() + (q ? `?${q}` : '')
  return apiClient.get<AdminSuppression[]>(url)
}
