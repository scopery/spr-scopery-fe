export interface EmailDelivery {
  id: string
  recipientEmail: string
  subject: string
  ruleId: string | null
  templateVersionId: string | null
  eventType: string
  workspaceId: string | null
  status: string
  failureReason: string | null
  createdAt: string
}
