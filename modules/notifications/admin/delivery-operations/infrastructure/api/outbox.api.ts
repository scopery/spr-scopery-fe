import { apiClient } from '@/shared/lib/apiClient'
import { ADMIN_DELIVERY_ENDPOINTS } from './endpoints'
import type { EmailOutbox } from '../../domain/model/email-outbox'

export interface SearchOutboxParams {
  status?: string
  limit?: number
  offset?: number
}

export async function searchOutbox(params?: SearchOutboxParams): Promise<EmailOutbox[]> {
  const p = new URLSearchParams()
  if (params?.status) p.set('status', params.status)
  if (params?.limit !== undefined) p.set('limit', String(params.limit))
  if (params?.offset !== undefined) p.set('offset', String(params.offset))
  const q = p.toString()
  const url = ADMIN_DELIVERY_ENDPOINTS.outbox.list() + (q ? `?${q}` : '')
  return apiClient.get<EmailOutbox[]>(url)
}

export async function getOutboxRecord(recordId: string): Promise<EmailOutbox> {
  return apiClient.get<EmailOutbox>(ADMIN_DELIVERY_ENDPOINTS.outbox.get(recordId))
}

export async function retryOutbox(recordId: string): Promise<EmailOutbox> {
  return apiClient.post<EmailOutbox>(ADMIN_DELIVERY_ENDPOINTS.outbox.retry(recordId))
}

export async function cancelOutbox(recordId: string): Promise<EmailOutbox> {
  return apiClient.post<EmailOutbox>(ADMIN_DELIVERY_ENDPOINTS.outbox.cancel(recordId))
}
