/** Notifications bounded-context facade. */

export {
  useNotifications,
  useUnreadNotificationCount,
} from './inbox/presentation/hooks/useNotifications'
export { NotificationInboxView } from './inbox/presentation/ui/NotificationInboxView'
export { resolveNotificationAction } from './lib/NotificationActionResolver'
export * from './alerts'
export * from './reminders'
export * from './project-subscriptions'
