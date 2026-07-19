import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_NOTIFICATION_ENDPOINTS } from '../../../inbox/infrastructure/api/endpoints'
import type { AlertEvent } from '../../domain/model/alert-event'

export async function listAlertEvents(workspaceId: string): Promise<AlertEvent[]> {
  return apiClient.get<AlertEvent[]>(WORKSPACE_NOTIFICATION_ENDPOINTS.alertEvents(workspaceId))
}

export async function acknowledgeAlert(workspaceId: string, id: string): Promise<AlertEvent> {
  return apiClient.post<AlertEvent>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.acknowledgeAlert(workspaceId, id)
  )
}

export async function dismissAlert(workspaceId: string, id: string): Promise<void> {
  await apiClient.post<void>(WORKSPACE_NOTIFICATION_ENDPOINTS.dismissAlert(workspaceId, id))
}
