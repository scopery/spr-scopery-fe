export interface DigestRun {
  id: string
  ruleId: string
  workspaceId: string
  status: string
  startedAt: string
  completedAt: string | null
  recipientCount: number | null
}
