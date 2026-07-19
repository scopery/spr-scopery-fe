export interface AlertRule {
  id: string
  workspaceId: string
  name: string
  triggerCondition: string
  severity: string
  channel: string
  status: string
  enabled: boolean
  createdAt: string
}

export interface CreateAlertRulePayload {
  name: string
  triggerCondition: string
  severity?: string
  channel?: string
}
