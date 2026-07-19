import { apiClient } from '@/shared/lib/apiClient'
import { USER_NOTIFICATION_ENDPOINTS } from './endpoints'
import type {
  NotificationPageResponse,
  UnreadCountResponse,
  UserNotification,
} from '../../domain/model/notification'

export async function listNotifications(params?: {
  page?: number
  size?: number
  includeDismissed?: boolean
}): Promise<NotificationPageResponse> {
  return apiClient.get<NotificationPageResponse>(
    USER_NOTIFICATION_ENDPOINTS.list({
      page: params?.page ?? 0,
      size: params?.size ?? 50,
      includeDismissed: params?.includeDismissed,
    })
  )
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>(USER_NOTIFICATION_ENDPOINTS.unreadCount())
  return res.unreadCount ?? 0
}

export async function markNotificationRead(id: string): Promise<UserNotification> {
  return apiClient.patch<UserNotification>(USER_NOTIFICATION_ENDPOINTS.markRead(id))
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch<void>(USER_NOTIFICATION_ENDPOINTS.markAllRead(), undefined, {
    parseJson: false,
  })
}

export async function dismissNotification(id: string): Promise<UserNotification> {
  return apiClient.patch<UserNotification>(USER_NOTIFICATION_ENDPOINTS.dismiss(id))
}
