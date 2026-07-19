export const AiPlanningRunStatus = {
  Queued: 'QUEUED',
  Running: 'RUNNING',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
} as const
export type AiPlanningRunStatus =
  (typeof AiPlanningRunStatus)[keyof typeof AiPlanningRunStatus]

export const SuggestionDecision = {
  Suggested: 'SUGGESTED',
  Accepted: 'ACCEPTED',
  Applied: 'APPLIED',
  Rejected: 'REJECTED',
} as const
export type SuggestionDecision =
  (typeof SuggestionDecision)[keyof typeof SuggestionDecision]
