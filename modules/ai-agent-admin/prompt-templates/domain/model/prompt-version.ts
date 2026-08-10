import type { PromptContentFormat, PromptVersionStatus } from '../enums/prompt.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiPromptVersion {
  id: string
  templateId: string
  templateCode: string | null
  versionNumber: number
  title: string
  content: string
  systemPrompt: string | null
  userPromptTemplate: string | null
  contentFormat: PromptContentFormat
  variableSchema: string | null
  changeNote: string | null
  responseFormat: string | null
  temperature: number | null
  topP: number | null
  maxTokens: number | null
  status: PromptVersionStatus
  activatedAt: string | null
  activatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAiPromptVersionPayload {
  templateId: string
  title: string
  content: string
  contentFormat: PromptContentFormat
  variableSchema?: string | null
  changeNote?: string | null
}

export interface UpdateAiPromptVersionPayload {
  title: string
  content: string
  contentFormat: PromptContentFormat
  variableSchema?: string | null
  changeNote?: string | null
  systemPrompt?: string | null
  userPromptTemplate?: string | null
}

export interface SearchAiPromptVersionsParams {
  templateId?: string
  status?: PromptVersionStatus | ''
  contentFormat?: PromptContentFormat | ''
  page?: number
  size?: number
}

export type AiPromptVersionPage = AiAdminPage<AiPromptVersion>
