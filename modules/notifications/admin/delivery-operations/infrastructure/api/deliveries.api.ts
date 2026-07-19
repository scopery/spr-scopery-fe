import { apiClient } from '@/shared/lib/apiClient'
import { ADMIN_DELIVERY_ENDPOINTS } from './endpoints'
import type { EmailDelivery } from '../../domain/model/email-delivery'

export interface SearchDeliveriesParams {
  status?: string
  workspaceId?: string
  limit?: number
  offset?: number
}

export async function searchDeliveries(params?: SearchDeliveriesParams): Promise<EmailDelivery[]> {
  const p = new URLSearchParams()
  if (params?.status) p.set('status', params.status)
  if (params?.workspaceId) p.set('workspaceId', params.workspaceId)
  if (params?.limit !== undefined) p.set('limit', String(params.limit))
  if (params?.offset !== undefined) p.set('offset', String(params.offset))
  const q = p.toString()
  const url = ADMIN_DELIVERY_ENDPOINTS.deliveries.list() + (q ? `?${q}` : '')
  return apiClient.get<EmailDelivery[]>(url)
}

export async function getDelivery(deliveryId: string): Promise<EmailDelivery> {
  return apiClient.get<EmailDelivery>(ADMIN_DELIVERY_ENDPOINTS.deliveries.get(deliveryId))
}
