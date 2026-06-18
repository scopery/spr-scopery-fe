/**
 * Types for AI payloads. proposed_value / value are unknown or record — light validation at runtime.
 */

export interface ImproveBody {
  question_id: string
  /** Current answer content so AI can improve/translate it. Required for correct result (e.g. translate the answer, not the question). */
  current_value?: string | Record<string, unknown> | null
  user_instruction?: string
}

/** API may return top-level proposed_value (legacy) or nested proposal.proposed_value */
export interface ImproveResponse {
  batch_token: string
  /** Legacy: proposed value at top level */
  proposed_value?: unknown
  /** Current: proposal object with proposed_value (string for text/textarea), old_value, diff_summary, etc. */
  proposal?: {
    question_id?: string
    old_value?: unknown
    proposed_value?: unknown
    diff_summary?: string
    rationale?: string
    confidence?: number
  }
}

export interface ImproveCommitBody {
  batch_token: string
  question_id: string
  action: 'accept' | 'reject'
  final_value?: unknown
}

/** Engine: agentkit_v2_file (default when AI_WF_QGEN_V2_ENABLED) or legacy. */
export type AiQuestionsGenerateEngine = 'agentkit_v2_file' | 'legacy'

export interface QuestionsGenerateBody {
  /** Optional. Default from BE. If 409 AI_FEATURE_DISABLED, FE can retry with engine "legacy". */
  engine?: AiQuestionsGenerateEngine
  /** Required for v2; for legacy, at least one of base_session_id or base_revision_id. */
  base_session_id?: string | null
  /** Legacy only (v2 ignores). */
  base_revision_id?: string | null
  instruction?: string
  max_items?: number
  /** v2 only. Optional, default true. */
  use_cached_digest?: boolean
}

export interface GeneratedQuestionItem {
  temp_id: string
  section: string
  tags?: string[]
  q_type: string
  prompt: string
  help_text?: string | null
  required: boolean
  answer_schema?: Record<string, unknown>
}

export interface QuestionsGenerateResponse {
  batch_token: string
  items: GeneratedQuestionItem[]
  /** Debug only; BE may include payload sent to workflow. FE can ignore when rendering. */
  payload_sent?: unknown
}

/** Patch fields applied to item before insert (API: section, tags, q_type, prompt, help_text, required, answer_schema). */
export interface QuestionsCommitPatch {
  section?: string
  tags?: string[]
  q_type?: string
  prompt?: string
  help_text?: string | null
  required?: boolean
  answer_schema?: Record<string, unknown>
}

export interface QuestionsCommitEdit {
  temp_id: string
  patch: QuestionsCommitPatch
}

export interface QuestionsCommitBody {
  batch_token: string
  accepted_temp_ids: string[]
  edits?: QuestionsCommitEdit[]
}

export interface IntakesUploadUrlResponse {
  upload_url: string
  file_id: string
}

export interface IntakesCreateBody {
  raw_text?: string
  file_id?: string
}

export interface IntakesCreateResponse {
  id: string
}

export interface ImpactAnalysisBody {
  base: { session_id?: string; revision_id?: string }
  intake: { intake_id: string }
}

export interface ImpactProposal {
  question_id: string
  proposed_value: unknown
  /** AI reason for the proposed change */
  reason?: string
  /** Excerpt(s) from the note that influenced this proposal (reference / citation from note). Backend may send as string or string[]. */
  reference_from_note?: string | string[]
}

export interface ImpactAnalysisResponse {
  batch_token: string
  /** Optional summary of the note (intake) used for analysis */
  note_summary?: string
  proposals: ImpactProposal[]
}

export interface ImpactCommitDecision {
  question_id: string
  action: 'accept' | 'reject'
  final_value?: unknown
}

export interface ImpactCommitBody {
  batch_token: string
  base: { session_id: string }
  intake_id: string
  decisions: ImpactCommitDecision[]
}
