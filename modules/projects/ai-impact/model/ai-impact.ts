/**
 * Types for AI impact analysis and intakes (project-scoped, future routes).
 */

export interface IntakesUploadUrlResponse {
  upload_url: string
  file_id: string
}

export interface IntakesUploadUrlBody {
  file_name: string
  mime_type: string
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
  reason?: string
  reference_from_note?: string | string[]
}

export interface ImpactAnalysisResponse {
  batch_token: string
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
