export type AIFeedbackRating = 'positive' | 'neutral' | 'negative'

export type AIFeedbackCategory =
  | 'inaccurate'
  | 'incomplete'
  | 'unclear'
  | 'too_verbose'
  | 'too_short'
  | 'wrong_format'
  | 'hallucinated'
  | 'unsafe'
  | 'irrelevant'
  | 'duplicated'
  | 'failed_to_follow_instruction'
  | 'other'

export type AIFeedbackStatus = 'open' | 'reviewed' | 'action_required' | 'resolved' | 'dismissed'

export interface SubmitAIRunFeedbackPayload {
  rating: AIFeedbackRating
  feedback_category?: AIFeedbackCategory | null
  feedback_text?: string | null
  expected_output_text?: string | null
}

export interface AIQualitySummary {
  totalFeedback: number
  positiveCount: number
  neutralCount: number
  negativeCount: number
  negativeRate: number | null
  feedbackByCategory: { category: AIFeedbackCategory | null; count: number }[]
  feedbackByAgent: {
    agentId: string | null
    agentKey: string | null
    agentName: string | null
    count: number
    negativeCount: number
  }[]
  feedbackByModel: {
    modelId: string | null
    provider: string | null
    modelName: string | null
    count: number
    negativeCount: number
  }[]
  feedbackByVersion: {
    agentVersionId: string | null
    versionNumber: number | null
    versionStatus: string | null
    count: number
    negativeCount: number
  }[]
  recentNegativeFeedback: AIRunFeedbackListItem[]
  failedRuns: number
  failedRunsWithFeedback: number
  runsWithFeedback: number
}

export interface AIRunFeedbackListItem {
  feedbackId: string
  runId: string
  createdAt: string
  rating: AIFeedbackRating
  feedbackCategory: AIFeedbackCategory | null
  feedbackTextPreview: string | null
  expectedOutputTextPreview: string | null
  status: AIFeedbackStatus
  reviewedBy: string | null
  reviewedAt: string | null
  agentName: string | null
  agentKey: string | null
  agentVersionId: string | null
  modelName: string | null
  provider: string | null
  projectId: string | null
  userId: string | null
  runStatus: string | null
  runMode: string | null
  runCreatedAt: string | null
  latestRating: AIFeedbackRating | null
}

export interface AIPromptVersionQualityItem {
  agentVersionId: string
  versionNumber: number
  versionStatus: string
  runCount: number
  feedbackCount: number
  negativeFeedbackCount: number
  negativeRate: number | null
  topIssueCategory: AIFeedbackCategory | null
  averageLatencyMs: number | null
  totalEstimatedCost: number | null
}

export const FEEDBACK_CATEGORIES: { value: AIFeedbackCategory; label: string }[] = [
  { value: 'inaccurate', label: 'Inaccurate' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'unclear', label: 'Unclear' },
  { value: 'too_verbose', label: 'Too verbose' },
  { value: 'too_short', label: 'Too short' },
  { value: 'wrong_format', label: 'Wrong format' },
  { value: 'hallucinated', label: 'Hallucinated' },
  { value: 'unsafe', label: 'Unsafe' },
  { value: 'irrelevant', label: 'Irrelevant' },
  { value: 'duplicated', label: 'Duplicated' },
  { value: 'failed_to_follow_instruction', label: 'Did not follow instruction' },
  { value: 'other', label: 'Other' },
]

export const FEEDBACK_STATUSES: { value: AIFeedbackStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'action_required', label: 'Action required' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]
