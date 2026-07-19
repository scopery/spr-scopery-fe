import type {
  ProviderSecretStatus,
  ProviderSecretType,
} from '../enums/provider-secret.enum'

/** Stored/returned secret — never includes raw secretValue. */
export interface AiProviderSecret {
  id: string
  providerId: string
  secretType: ProviderSecretType
  maskedValue: string
  status: ProviderSecretStatus
  keyVersion: string
  description?: string | null
  createdAt: string
}

/** Ephemeral create payload — secretValue must not be cached after submit. */
export interface SaveAiProviderSecretPayload {
  providerId: string
  secretType: ProviderSecretType
  secretValue: string
  description?: string | null
}

export interface RotateAiProviderSecretPayload {
  secretValue: string
  description?: string | null
}

export interface SearchAiProviderSecretsParams {
  providerId?: string
  secretType?: ProviderSecretType | ''
  status?: ProviderSecretStatus | ''
  page?: number
  size?: number
}

export interface AiProviderSecretPage {
  items: AiProviderSecret[]
  page: number
  size: number
  totalElements: number
  totalPages?: number
}
