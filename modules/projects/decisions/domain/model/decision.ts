/** Matches BE `DecisionRecordResponse` (`/api/projects/{projectId}/decisions`). */
export interface DecisionRecord {
  id: string
  projectId: string
  code: string
  title: string
  category: string
  status: string
  rationale: string | null
  outcome: string | null
  decidedAt: string | null
  decidedBy: string | null
  createdAt: string
}

export interface CreateDecisionPayload {
  title: string
  rationale?: string | null
  category?: string
  code: string
}

export interface UpdateDecisionPayload {
  title?: string
  rationale?: string | null
  category?: string
}

export interface DecideDecisionPayload {
  outcome?: string
}

export interface RejectDecisionPayload {
  reason?: string | null
}

export interface SupersedeDecisionPayload {
  reason?: string | null
}

/** Matches BE `DecisionOptionResponse` (`.../decisions/{decisionId}/options`). */
export interface DecisionOption {
  id: string
  decisionId: string
  optionTitle: string
  optionDescription: string | null
  pros: string | null
  cons: string | null
  estimatedImpact: string | null
  selectedFlag: boolean
}

export interface CreateDecisionOptionPayload {
  optionTitle: string
  optionDescription?: string | null
  pros?: string | null
  cons?: string | null
  estimatedImpact?: string | null
}

export interface UpdateDecisionOptionPayload {
  optionTitle?: string
  optionDescription?: string | null
  pros?: string | null
  cons?: string | null
  estimatedImpact?: string | null
  selectedFlag?: boolean
}

export interface DecisionImpact {
  decisionId: string
  scheduleDaysImpact: number | null
  costImpact: number | null
  scopeImpact: string | null
  description: string | null
}

export interface UpdateDecisionImpactPayload {
  scheduleDaysImpact?: number | null
  costImpact?: number | null
  scopeImpact?: string | null
  description?: string | null
}

export interface DecisionLink {
  id: string
  decisionId: string
  targetType: string
  targetId: string
  linkType: string
}

export interface CreateDecisionLinkPayload {
  targetType: string
  targetId: string
  linkType: string
}
