import type { ModelStatus, ModelType } from '../enums/model.enum'
import type { AiAdminPage } from '../../../infrastructure/api/page-response'

export interface AiModel {
  id: string
  providerId: string
  name: string
  code: string
  providerModelId: string | null
  type: ModelType
  status: ModelStatus
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAiModelPayload {
  providerId: string
  name: string
  code: string
  providerModelId?: string | null
  type: ModelType
  description?: string | null
}

export interface UpdateAiModelPayload {
  name: string
  providerModelId?: string | null
  type: ModelType
  description?: string | null
}

export interface SearchAiModelsParams {
  providerId?: string
  keyword?: string
  status?: ModelStatus | ''
  type?: ModelType | ''
  page?: number
  size?: number
}

export type AiModelPage = AiAdminPage<AiModel>
