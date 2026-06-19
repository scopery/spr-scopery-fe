/**
 * Types for AI question-generation payloads.
 */

export type AiQuestionsGenerateEngine = 'agentkit_v2_file' | 'legacy'

export interface QuestionsGenerateBody {
  engine?: AiQuestionsGenerateEngine
  base_session_id?: string | null
  base_revision_id?: string | null
  instruction?: string
  max_items?: number
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
  payload_sent?: unknown
}

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
