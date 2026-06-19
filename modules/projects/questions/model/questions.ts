export interface ProjectQuestion {
  id: string
  project_id: string
  source: string
  system_question_id: string | null
  section: string
  tags: string[]
  q_type: string
  prompt: string
  help_text: string | null
  required: boolean
  answer_schema: Record<string, unknown>
  visibility_logic: unknown
  status: string
  position?: number
  created_at: string
}

export interface ProjectQuestionsResponse {
  [section: string]: ProjectQuestion[]
}

export interface CreateQuestionPayload {
  section: string
  tags?: string[]
  q_type: string
  prompt: string
  help_text?: string | null
  required: boolean
  answer_schema?: Record<string, unknown>
  visibility_logic?: unknown
}
