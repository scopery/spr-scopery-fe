import type { ProviderStatus, ProviderType } from '../enums/provider.enum'

export interface AiProvider {
  id: string
  name: string
  code: string
  type: ProviderType
  status: ProviderStatus
  apiBaseUrl: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAiProviderPayload {
  name: string
  code: string
  type: ProviderType
  apiBaseUrl?: string | null
  description?: string | null
}

export interface UpdateAiProviderPayload {
  name: string
  type: ProviderType
  apiBaseUrl?: string | null
  description?: string | null
}

export interface SearchAiProvidersParams {
  keyword?: string
  type?: ProviderType | ''
  status?: ProviderStatus | ''
  page?: number
  size?: number
}

export interface AiProviderPage {
  items: AiProvider[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
}
