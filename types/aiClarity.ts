/**
 * AI Clarity Assessment — types for assess-one response and summary.
 */

export type ClarityLabel = 'unclear' | 'partially_clear' | 'clear' | 'very_clear'

export interface ClarityFollowUpQuestion {
  prompt: string
  priority: 'must' | 'should' | 'could'
}

export interface ClarityAssessment {
  clarity_score: number
  clarity_label: ClarityLabel
  ambiguity_tags: string[]
  missing_fields: string[]
  answer_guidance: string[]
  suggested_answer_template: string | null
  follow_up_questions: ClarityFollowUpQuestion[]
}

export interface AssessOneResponse {
  question_order: number
  assessment: ClarityAssessment
}

export interface ClaritySummaryStats {
  required_total?: number
  required_answered?: number
  assessed_count?: number
  missing_assessments?: number
}

export interface ClaritySummary {
  coverage_score?: number
  clarity_score?: number
  preparation_score?: number
  overall_readiness?: number
  readiness_label?: string
  top_blockers?: Array<{
    question_order?: number
    question_orders?: number[]
    section?: string
    prompt?: string
    reason?: string
  }>
  suggested_fixes?: Array<{ question_order?: number; section?: string; prompt?: string; suggestion?: string }>
  stats?: ClaritySummaryStats
  missing_assessments?: number
}

export interface AssessOnePayload {
  question_order: number
  section: string
  question_text: string
  answer_text: string
  q_type: string | null
  required: boolean
}
