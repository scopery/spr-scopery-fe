/** Matches BE `RaidItemResponse` (`/api/projects/{projectId}/raid-items`). */
export interface RaidItem {
  id: string
  projectId: string
  type: string
  code: string
  title: string
  description: string | null
  status: string
  ownerUserId: string | null
  severity: string | null
  probability: string | null
  impact: string | null
  riskScore: number | null
  riskScoreFormulaVersion: string | null
  riskResponseStrategy: string | null
  escalationLevel: string | null
  linkedChangeRequestId: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRaidItemPayload {
  type: string
  title: string
  code: string
  description?: string | null
  ownerUserId?: string | null
  probability?: string | null
  impact?: string | null
  riskResponseStrategy?: string | null
  riskTrigger?: string | null
  severity?: string | null
  issueCategory?: string | null
  impactSummary?: string | null
  rootCause?: string | null
  resolutionPlan?: string | null
  assumptionStatement?: string | null
  validationStatus?: string | null
  dependencyType?: string | null
}

export interface UpdateRaidItemPayload {
  title?: string
  description?: string | null
  ownerUserId?: string | null
  probability?: string | null
  impact?: string | null
  riskResponseStrategy?: string | null
  severity?: string | null
}

export interface ChangeRaidItemStatusPayload {
  status: string
}

export interface ResolveRaidItemPayload {
  resolutionPlan?: string | null
}

export interface EscalateRaidItemPayload {
  escalationLevel?: string | null
  reason?: string | null
}
