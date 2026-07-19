export interface NotificationPreferenceProfile {
  timezone: string | null
  defaultMode: string | null
  digestEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

export interface UpdateNotificationPreferencePayload {
  timezone?: string
  defaultMode?: string
  digestEnabled?: boolean
  quietHoursEnabled?: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}

export interface NotificationSubscription {
  id: string
  targetType: string
  targetId: string
  subscriptionLevel: string
  status: string
}

export interface CreateSubscriptionPayload {
  targetType: string
  targetId: string
  subscriptionLevel?: string
}

export interface ChannelPreferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  pushEnabled: boolean
  smsEnabled: boolean
}

export interface UpsertChannelPreferencesPayload {
  emailEnabled?: boolean
  inAppEnabled?: boolean
  pushEnabled?: boolean
  smsEnabled?: boolean
}

export interface NotificationSuppression {
  id: string
  userId: string
  channel: string
  category: string | null
  reason: string | null
  source: string | null
  suppressedAt: string
  expiresAt: string | null
}
