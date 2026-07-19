import { apiPath } from '@/shared/lib/api-paths'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const USER_NOTIFICATION_ENDPOINTS = {
  list: (params?: { page?: number; size?: number; includeDismissed?: boolean }) =>
    withQuery(apiPath('/notifications'), params),
  unreadCount: () => apiPath('/notifications/unread-count'),
  markRead: (id: string) => apiPath(`/notifications/${id}/read`),
  markAllRead: () => apiPath('/notifications/read-all'),
  dismiss: (id: string) => apiPath(`/notifications/${id}/dismiss`),
} as const

export const WORKSPACE_NOTIFICATION_ENDPOINTS = {
  preferences: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/preferences/me`),
  subscriptions: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/subscriptions`),
  subscription: (workspaceId: string, subscriptionId: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/subscriptions/${subscriptionId}`),
  channelPreferences: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/channel-preferences/me`),
  suppressions: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/suppressions`),
  reminderInstances: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/reminder-instances`),
  snoozeReminder: (workspaceId: string, id: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/reminder-instances/${id}/snooze`),
  dismissReminder: (workspaceId: string, id: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/reminder-instances/${id}/dismiss`),
  alertEvents: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/alert-events`),
  acknowledgeAlert: (workspaceId: string, id: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/alert-events/${id}/acknowledge`),
  dismissAlert: (workspaceId: string, id: string) =>
    apiPath(`/workspaces/${workspaceId}/notifications/alert-events/${id}/dismiss`),
} as const
