export interface ReminderRule {
  id: string
  workspaceId: string
  name: string
  triggerCondition: string
  offsetMinutes: number
  channel: string
  status: string
  enabled: boolean
  createdAt: string
}

export interface CreateReminderRulePayload {
  name: string
  triggerCondition: string
  offsetMinutes: number
  channel?: string
}
