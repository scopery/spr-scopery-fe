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
  roundId: string | null
  sequence: number
  questionText: string
  answerText: string | null
  clarityLevel: string | null
  aiFeedback: string | null
  status: string
  source: string
  parentQuestionId: string | null
  answeredAt: string | null
  suggestedAnswers: string[] | null
  createdAt: string
  updatedAt: string
}

/** Matches BE ElicitationRoundResponse — lifecycle: ACTIVE → EVALUATED */
export interface ElicitationRound {
  id: string
  sessionId: string
  roundNumber: number
  questionsJson: string | null
  overallClarity: string | null
  status: 'ACTIVE' | 'EVALUATED'
  shouldContinue: boolean | null
  evaluatedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Matches BE RoundEvaluation inner record */
export interface RoundEvaluation {
  questionId: string
  clarityLevel: string | null
  feedback: string | null
  conflictNote: string | null
}

/** Matches BE SubmitRoundResponse */
export interface SubmitRoundResponse {
  round: ElicitationRound
  evaluations: RoundEvaluation[]
  shouldContinue: boolean
  evaluationSummary: string | null
}

/** Matches BE ScopeLockResponse */
export interface ScopeLockResponse {
  locked: boolean
  sessionId: string | null
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
  requirementId: string | null
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

export interface ScopeTreeEntity {
  id: string
  title: string
  type: 'REQUIREMENT' | 'FUNCTION' | 'USE_CASE' | 'SCREEN' | 'COMPONENT' | 'NOTIFICATION'
  children?: ScopeTreeEntity[]
  pendingAction?: string | null
  changes?: Record<string, { before: unknown; after: unknown }> | null
}

export interface ScopeTreeResponse {
  before: ScopeTreeEntity[]
  after: ScopeTreeEntity[]
}

export interface StartElicitationSessionPayload {
  scopePackageId: string
  title?: string | null
}

export interface AnswerQuestionPayload {
  answerText: string
}
