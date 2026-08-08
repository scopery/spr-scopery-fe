/** Matches BE ElicitationSessionResponse */
export interface ElicitationSession {
  id: string
  projectId: string
  scopePackageId: string
  title: string | null
  status: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** Matches BE ElicitationQuestionResponse */
export interface ElicitationQuestion {
  id: string
  sessionId: string
  sequence: number
  questionText: string
  answerText: string | null
  clarityLevel: string | null
  aiFeedback: string | null
  status: string
  source: string
  parentQuestionId: string | null
  answeredAt: string | null
  createdAt: string
  updatedAt: string
}

/** Matches BE ElicitationRoundResponse */
export interface ElicitationRound {
  id: string
  sessionId: string
  roundNumber: number
  questionsJson: string
  overallClarity: string | null
  status: string
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Matches BE ElicitationSuggestionItemResponse */
export interface ElicitationSuggestionItem {
  id: string
  suggestionId: string
  sequence: number
  action: string
  targetEntityType: string | null
  targetEntityId: string | null
  targetEntityName: string | null
  rationale: string
  estimatedImpact: string
  status: string
  errorMessage: string | null
  executedAt: string | null
  createdAt: string
}

/** Matches BE ElicitationSuggestionResponse */
export interface ElicitationSuggestion {
  id: string
  roundId: string
  overallSummary: string | null
  status: string
  createdAt: string
  items: ElicitationSuggestionItem[]
}

export interface StartElicitationSessionPayload {
  scopePackageId: string
  title?: string | null
}

export interface AnswerQuestionPayload {
  answerText: string
}
