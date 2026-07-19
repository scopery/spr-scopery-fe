import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'

export const PROJECT_NOTIFICATION_ENDPOINTS = {
  subscriptions: (projectId: string) =>
    apiPath(`/projects/${projectId}/notification-subscriptions`),
  mySubscriptions: (projectId: string) =>
    apiPath(`/projects/${projectId}/notification-subscriptions/me`),
  mute: (projectId: string, subscriptionId: string) =>
    apiPath(`/projects/${projectId}/notification-subscriptions/${subscriptionId}/mute`),
  unmute: (projectId: string, subscriptionId: string) =>
    apiPath(`/projects/${projectId}/notification-subscriptions/${subscriptionId}/unmute`),
  subscription: (projectId: string, subscriptionId: string) =>
    apiPath(`/projects/${projectId}/notification-subscriptions/${subscriptionId}`),
  preferencesMe: (projectId: string) =>
    apiPath(`/projects/${projectId}/notification-preferences/me`),
} as const

export interface ProjectNotificationSubscription {
  id: string
  projectId: string
  subscriberUserId?: string
  subscriptionType: string
  muted?: boolean
  status?: string
}

export interface ProjectNotificationPreference {
  eventCode: string
  channel: string
  enabled: boolean
  muted: boolean
}

export async function listMyProjectSubscriptions(
  projectId: string
): Promise<{ items: ProjectNotificationSubscription[] }> {
  const res = await apiClient.get<ListPayload<ProjectNotificationSubscription>>(PROJECT_NOTIFICATION_ENDPOINTS.mySubscriptions(projectId))
  return normalizeItemList(res)
}

export async function subscribeToProject(
  projectId: string,
  body: { subscriberUserId?: string; subscriptionType: string }
): Promise<ProjectNotificationSubscription> {
  return apiClient.post(PROJECT_NOTIFICATION_ENDPOINTS.subscriptions(projectId), body)
}

export async function muteProjectSubscription(
  projectId: string,
  subscriptionId: string
): Promise<void> {
  await apiClient.patch(
    PROJECT_NOTIFICATION_ENDPOINTS.mute(projectId, subscriptionId),
    {},
    { parseJson: false }
  )
}

export async function unmuteProjectSubscription(
  projectId: string,
  subscriptionId: string
): Promise<void> {
  await apiClient.patch(
    PROJECT_NOTIFICATION_ENDPOINTS.unmute(projectId, subscriptionId),
    {},
    { parseJson: false }
  )
}

export async function unsubscribeFromProject(
  projectId: string,
  subscriptionId: string
): Promise<void> {
  await apiClient.delete(PROJECT_NOTIFICATION_ENDPOINTS.subscription(projectId, subscriptionId), {
    parseJson: false,
  })
}

export async function getMyProjectPreferences(
  projectId: string
): Promise<{ preferences: ProjectNotificationPreference[] }> {
  return apiClient.get(PROJECT_NOTIFICATION_ENDPOINTS.preferencesMe(projectId))
}

export async function upsertMyProjectPreferences(
  projectId: string,
  preferences: ProjectNotificationPreference[]
): Promise<{ preferences: ProjectNotificationPreference[] }> {
  return apiClient.put(PROJECT_NOTIFICATION_ENDPOINTS.preferencesMe(projectId), { preferences })
}
