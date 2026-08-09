export interface AiPlanningRun {
  id: string
  projectId: string
  workspaceId: string
  actorUserId: string
  runType: string
  status: string
  inputSummaryJson: string | null
  outputSummaryJson: string | null
  errorCode: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  traceId: string | null
  createdAt: string
  updatedAt: string
}

export interface AiPlanningSuggestion {
  id: string
  planningRunId: string
  projectId: string
  suggestionType: string
  title: string
  summary: string | null
  rationale: string | null
  confidenceLabel: string | null
  status: string
  reviewedAt: string | null
  appliedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  requiresChangeRequest?: boolean
}
