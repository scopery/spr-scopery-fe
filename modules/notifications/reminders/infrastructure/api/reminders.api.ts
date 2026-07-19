import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_NOTIFICATION_ENDPOINTS } from '../../../inbox/infrastructure/api/endpoints'
import type { ReminderInstance } from '../../domain/model/reminder-instance'

export async function listReminderInstances(workspaceId: string): Promise<ReminderInstance[]> {
  return apiClient.get<ReminderInstance[]>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.reminderInstances(workspaceId)
  )
}

export async function snoozeReminder(
  workspaceId: string,
  id: string,
  body: { snoozedUntil: string }
): Promise<ReminderInstance> {
  return apiClient.post<ReminderInstance>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.snoozeReminder(workspaceId, id),
    body
  )
}

export async function dismissReminder(workspaceId: string, id: string): Promise<void> {
  await apiClient.post<void>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.dismissReminder(workspaceId, id)
  )
}
