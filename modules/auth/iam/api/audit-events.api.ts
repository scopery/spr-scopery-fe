import { apiClient } from '@/shared/lib/apiClient'
import { IAM_ENDPOINTS } from './endpoints'
import type { IamAuditEvent, IamPageResponse, SearchAuditEventsParams } from '../model'

export async function listAuditEvents(
  params?: SearchAuditEventsParams
): Promise<IamPageResponse<IamAuditEvent>> {
  return apiClient.get<IamPageResponse<IamAuditEvent>>(IAM_ENDPOINTS.auditEvents.list(params))
}
