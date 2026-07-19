import type { NotificationSeverity, NotificationStatus } from '../enums/notification.enum'

export interface UserNotification {
  id: string
  recipientUserId: string
  eventDefinitionId: string | null
  sourceSystem: string | null
  title: string
  bodyPreview: string | null
  severity: NotificationSeverity | string
  priority: string | null
  actionType: string | null
  actionUrl: string | null
  mandatory: boolean
  status: NotificationStatus | string
  readAt: string | null
  dismissedAt: string | null
  workspaceId: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationPageResponse {
  items: UserNotification[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
}

export interface UnreadCountResponse {
  unreadCount: number
}
