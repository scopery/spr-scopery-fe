export interface TemplateListItem {
  id: string
  name: string
  version: string
  status: string
  created_at: string
}

export interface TemplateListResponse {
  items: TemplateListItem[]
  page: { limit: number; offset: number; total: number }
}

export interface SystemQuestion {
  id: string
  template_id: string
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

export interface TemplateDetail extends TemplateListItem {
  questions: SystemQuestion[]
}

export interface CreateTemplateBody {
  name: string
  version?: string
}

export interface AddTemplateQuestionBody {
  section: string
  tags?: string[]
  q_type: string
  prompt: string
  help_text?: string | null
  required: boolean
  answer_schema: Record<string, unknown>
  visibility_logic?: unknown
  position?: number
}
