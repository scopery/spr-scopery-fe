export const NotificationStatus = {
  Unread: 'UNREAD',
  Read: 'READ',
  Dismissed: 'DISMISSED',
} as const
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus]

export const NotificationSeverity = {
  Info: 'INFO',
  Warning: 'WARNING',
  Critical: 'CRITICAL',
} as const
export type NotificationSeverity =
  (typeof NotificationSeverity)[keyof typeof NotificationSeverity]
