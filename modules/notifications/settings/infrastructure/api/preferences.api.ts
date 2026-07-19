import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_NOTIFICATION_ENDPOINTS } from '../../../inbox/infrastructure/api/endpoints'
import type {
  ChannelPreferences,
  CreateSubscriptionPayload,
  NotificationPreferenceProfile,
  NotificationSubscription,
  NotificationSuppression,
  UpdateNotificationPreferencePayload,
  UpsertChannelPreferencesPayload,
} from '../../domain/model/preferences'

export async function getPreferences(
  workspaceId: string
): Promise<NotificationPreferenceProfile> {
  return apiClient.get<NotificationPreferenceProfile>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.preferences(workspaceId)
  )
}

export async function updatePreferences(
  workspaceId: string,
  body: UpdateNotificationPreferencePayload
): Promise<NotificationPreferenceProfile> {
  return apiClient.put<NotificationPreferenceProfile>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.preferences(workspaceId),
    body
  )
}

export async function listSubscriptions(
  workspaceId: string
): Promise<NotificationSubscription[]> {
  const res = await apiClient.get<NotificationSubscription[] | { items: NotificationSubscription[] }>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.subscriptions(workspaceId)
  )
  if (Array.isArray(res)) return res
  return res.items ?? []
}

export async function createSubscription(
  workspaceId: string,
  body: CreateSubscriptionPayload
): Promise<NotificationSubscription> {
  return apiClient.post<NotificationSubscription>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.subscriptions(workspaceId),
    body
  )
}

export async function deleteSubscription(
  workspaceId: string,
  subscriptionId: string
): Promise<void> {
  await apiClient.delete<void>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.subscription(workspaceId, subscriptionId),
    { parseJson: false }
  )
}

export async function getChannelPreferences(workspaceId: string): Promise<ChannelPreferences> {
  return apiClient.get<ChannelPreferences>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.channelPreferences(workspaceId)
  )
}

export async function upsertChannelPreferences(
  workspaceId: string,
  body: UpsertChannelPreferencesPayload
): Promise<ChannelPreferences> {
  return apiClient.put<ChannelPreferences>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.channelPreferences(workspaceId),
    body
  )
}

export async function listSuppressions(workspaceId: string): Promise<NotificationSuppression[]> {
  return apiClient.get<NotificationSuppression[]>(
    WORKSPACE_NOTIFICATION_ENDPOINTS.suppressions(workspaceId)
  )
}
