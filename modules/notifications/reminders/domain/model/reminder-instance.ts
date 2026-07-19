export interface ReminderInstance {
  id: string
  workspaceId: string
  title: string
  body: string | null
  dueAt: string
  snoozedUntil: string | null
  dismissed: boolean
  source: {
    type: string
    entityId: string
  }
}
