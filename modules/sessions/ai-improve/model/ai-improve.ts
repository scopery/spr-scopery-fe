/**
 * Types for AI answer-improve payloads.
 */

export interface ImproveBody {
  question_id: string
  /** Current answer content so AI can improve/translate it. */
  current_value?: string | Record<string, unknown> | null
  user_instruction?: string
}

/** API may return top-level proposed_value (legacy) or nested proposal.proposed_value */
export interface ImproveResponse {
  batch_token: string
  proposed_value?: unknown
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
