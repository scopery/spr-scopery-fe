import type { PromptTemplateStatus } from '../enums/prompt.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiPromptTemplate {
  id: string
  agentId: string
  name: string
  code: string
  description: string | null
  status: PromptTemplateStatus
  createdAt: string
  updatedAt: string
  /** Optional denormalized counts if BE returns them */
  activeVersionId?: string | null
  draftVersionCount?: number
}

export interface CreateAiPromptTemplatePayload {
  agentId: string
  name: string
  code: string
  description?: string | null
}

export interface UpdateAiPromptTemplatePayload {
  name: string
  description?: string | null
}

export interface SearchAiPromptTemplatesParams {
  agentId?: string
  keyword?: string
  status?: PromptTemplateStatus | ''
  page?: number
  size?: number
}

export type AiPromptTemplatePage = AiAdminPage<AiPromptTemplate>
