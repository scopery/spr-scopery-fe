/**
 * AI Features Type Definitions
 * Covers: Improve Answer, QGen, Clarity Assessment, Impact Analysis, Admin AI
 */

import type {
  AiQuestionsGenerateEngine,
  AiEngineType,
  AiPurpose,
  AiRunStatus,
  QuestionType,
} from '@/shared/lib/api-enums'

export type {
  AiQuestionsGenerateEngine,
  AiEngineType,
  AiPurpose,
  AiRunStatus,
} from '@/shared/lib/api-enums'

// ============================================================================
// 1. Improve Answer
// ============================================================================

export interface ImproveAnswerRequest {
  question_id: string
  current_value: unknown
  user_instruction?: string
}

export interface ImproveAnswerProposal {
  question_id: string
  proposed_value: unknown
  diff_summary?: string
  rationale?: string
  confidence?: number
}

export interface ImproveAnswerResponse {
  batch_token: string
  proposed_value: unknown
  proposal?: ImproveAnswerProposal
  run_id: string
}

export interface ImproveAnswerCommitRequest {
  batch_token: string
  action: 'accept' | 'reject'
  final_value?: unknown
}

// ============================================================================
// 2. Generate Clarifying Questions
// ============================================================================

export interface QGenGenerateRequest {
  engine?: AiQuestionsGenerateEngine
  base_session_id?: string
  base_revision_id?: string
  instruction?: string
  max_items?: number
  use_cached_digest?: boolean
}

export interface QGenQuestionProposal {
  temp_id: string
  section: string
  tags: string[]
  q_type: QuestionType
  prompt: string
  help_text: string | null
  required: boolean
  answer_schema: unknown
}

export interface QGenGenerateResponse {
  batch_token: string
  items: QGenQuestionProposal[]
  payload_sent?: unknown
}

export interface QGenQuestionEdit {
  temp_id: string
  patch: Partial<{
    section: string
    tags: string[]
    q_type: QuestionType
    prompt: string
    help_text: string | null
    required: boolean
    answer_schema: unknown
  }>
}

export interface QGenCommitRequest {
  batch_token: string
  accepted_temp_ids: string[]
  edits?: QGenQuestionEdit[]
}

// ============================================================================
// 3. Clarity Assessment
// ============================================================================

export interface ClarityAssessOneRequest {
  question_order: number
  section: string
  question_text: string
  answer_text: string
  q_type: QuestionType | null
  required: boolean
}

export interface ClarityAssessment {
  clarity_score: number
  clarity_label: string
  ambiguity_tags: string[]
  missing_fields: string[]
  answer_guidance: string[]
  suggested_answer_template: string | null
  follow_up_questions: string[]
}

export interface ClarityAssessOneResponse {
  question_order: number
  assessment: ClarityAssessment
}

export interface ClarityRequirementCoverage {
  answered_required_ratio: number
  avg_clarity: number
  count: number
}

export interface ClarityTopBlocker {
  section: string
  reason: string
  question_orders: number[]
}

export interface ClaritySuggestedFix {
  question_order: number
  answer_guidance: string[]
  suggested_answer_template: string | null
}

export interface ClaritySummaryResponse {
  coverage_score: number
  clarity_score: number
  preparation_score: number
  requirements_coverage: {
    business?: ClarityRequirementCoverage
    stakeholder?: ClarityRequirementCoverage
    functional?: ClarityRequirementCoverage
    nfr?: ClarityRequirementCoverage
    transition?: ClarityRequirementCoverage
  }
  hidden_aspects_score: number
  overall_readiness: number
  readiness_label: string
  top_blockers: ClarityTopBlocker[]
  suggested_fixes: ClaritySuggestedFix[]
  recommended_next_action: string
  stats: {
    total_questions: number
    required_total: number
    required_answered: number
    assessed_count: number
    missing_assessments: number
  }
}

// ============================================================================
// 4. Impact Analysis
// ============================================================================

export interface IntakeUploadUrlRequest {
  file_name: string
  mime_type: string
}

export interface IntakeUploadUrlResponse {
  upload_url: string
  file_id: string
  expires_at: string
}

export interface IntakeCreateRequest {
  raw_text?: string
  file_id?: string
}

export interface IntakeResponse {
  id: string
  type: 'paste_text' | 'note_upload'
  created_at: string
}

export interface ImpactAnalysisRequest {
  base: {
    session_id?: string
    revision_id?: string
  }
  intake: {
    intake_id: string
  }
}

export interface ImpactProposal {
  question_id: string
  proposed_value: unknown
  reason: string
  reference_from_note?: string
}

export interface ImpactAnalysisResponse {
  batch_token: string
  note_summary?: string
  proposals: ImpactProposal[]
}

export interface ImpactDecision {
  question_id: string
  action: 'accept' | 'reject'
  final_value?: unknown
}

export interface ImpactCommitRequest {
  batch_token: string
  base: {
    session_id?: string
    revision_id?: string
  }
  intake_id: string
  decisions: ImpactDecision[]
}

// ============================================================================
// 5. Admin AI
// ============================================================================

export interface AiConfig {
  purpose: AiPurpose
  enabled: boolean
  primary_engine: AiEngineType
  fallback_engine: AiEngineType | null
  workflow_id: string | null
  agent_entry: string | null
  model: string | null
  temperature: number | null
  max_output_tokens: number | null
  timeout_ms: number | null
  schema_version: number
  notes: string | null
  updated_by: string | null
  updated_at: string
}

export interface AiConfigsListResponse {
  items: AiConfig[]
}

export interface AiConfigUpdateRequest {
  enabled?: boolean
  primary_engine?: AiEngineType
  fallback_engine?: AiEngineType | null
  workflow_id?: string | null
  agent_entry?: string | null
  model?: string | null
  temperature?: number | null
  max_output_tokens?: number | null
  timeout_ms?: number | null
  notes?: string | null
}

export interface AiTestRunRequest {
  input: unknown
  use_fallback?: boolean
}

export interface AiTestRunResponse {
  run_id: string
  engine_used: AiEngineType
  output: unknown
}

export interface AiRun {
  id: string
  purpose: AiPurpose
  org_id: string | null
  project_id: string | null
  session_id: string | null
  user_id: string | null
  engine_used: AiEngineType
  workflow_id: string | null
  agent_entry: string | null
  model: string | null
  status: AiRunStatus
  error_code: string | null
  error_detail: string | null
  latency_ms: number
  request_id: string | null
  payload_redacted: unknown
  output_redacted: unknown
  created_at: string
}

export interface AiRunsListRequest {
  purpose?: AiPurpose
  status?: AiRunStatus
  limit?: number
  offset?: number
}

export interface AiRunsListResponse {
  items: AiRun[]
  page: {
    limit: number
    offset: number
    total: number
  }
}
