export const SessionStatus = {
  Active: 'ACTIVE',
  Closed: 'CLOSED',
  Cancelled: 'CANCELLED',
} as const
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]

export const QuestionStatus = {
  Pending: 'PENDING',
  Answered: 'ANSWERED',
  Skipped: 'SKIPPED',
} as const
export type QuestionStatus = (typeof QuestionStatus)[keyof typeof QuestionStatus]

export const QuestionSource = {
  AiGenerated: 'AI_GENERATED',
  Feedback: 'FEEDBACK',
} as const
export type QuestionSource = (typeof QuestionSource)[keyof typeof QuestionSource]

export const ClarityLevel = {
  Blocked: 'BLOCKED',
  Critical: 'CRITICAL',
  Important: 'IMPORTANT',
  Minor: 'MINOR',
  Cleared: 'CLEARED',
} as const
export type ClarityLevel = (typeof ClarityLevel)[keyof typeof ClarityLevel]

export const RoundStatus = {
  Active: 'ACTIVE',
  Evaluated: 'EVALUATED',
} as const
export type RoundStatus = (typeof RoundStatus)[keyof typeof RoundStatus]

export const SuggestionStatus = {
  Pending: 'PENDING',
  PartiallyApproved: 'PARTIALLY_APPROVED',
  Completed: 'COMPLETED',
} as const
export type SuggestionStatus = (typeof SuggestionStatus)[keyof typeof SuggestionStatus]

export const SuggestionItemStatus = {
  Pending: 'PENDING',
  Approved: 'APPROVED',
  Executing: 'EXECUTING',
  Succeeded: 'SUCCEEDED',
  Failed: 'FAILED',
  Skipped: 'SKIPPED',
  Rejected: 'REJECTED',
} as const
export type SuggestionItemStatus =
  (typeof SuggestionItemStatus)[keyof typeof SuggestionItemStatus]

export const SuggestionItemImpact = {
  Low: 'LOW',
  Medium: 'MEDIUM',
  High: 'HIGH',
} as const
export type SuggestionItemImpact =
  (typeof SuggestionItemImpact)[keyof typeof SuggestionItemImpact]
