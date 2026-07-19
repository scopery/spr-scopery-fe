export interface EmailRule {
  id: string
  name: string
  triggerEvent: string
  templateId: string | null
  priority: number
  mandatory: boolean
  status: string
  enabled: boolean
  scope: string | null
  createdAt: string
}

export interface CreateEmailRulePayload {
  name: string
  triggerEvent: string
  templateId?: string | null
  priority?: number
  mandatory?: boolean
  scope?: string | null
}

export interface UpdateEmailRulePayload {
  name?: string
  triggerEvent?: string
  templateId?: string | null
  priority?: number
  mandatory?: boolean
}
