export interface DigestRule {
  id: string
  workspaceId: string
  name: string
  schedule: string
  channel: string
  status: string
  enabled: boolean
  createdAt: string
}

export interface CreateDigestRulePayload {
  name: string
  schedule: string
  channel?: string
}
