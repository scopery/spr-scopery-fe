import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import type {
  AiProviderSecret,
  AiProviderSecretPage,
  RotateAiProviderSecretPayload,
  SaveAiProviderSecretPayload,
  SearchAiProviderSecretsParams,
} from '../../domain/model/provider-secret'

function normalizePage(res: unknown): AiProviderSecretPage {
  if (!res || typeof res !== 'object') {
    return { items: [], page: 0, size: 20, totalElements: 0 }
  }
  const p = res as Record<string, unknown>
  const items = Array.isArray(p.items)
    ? (p.items as AiProviderSecret[])
    : Array.isArray(p.content)
      ? (p.content as AiProviderSecret[])
      : []
  const page = typeof p.page === 'number' ? p.page : 0
  const size = typeof p.size === 'number' ? p.size : items.length
  const totalElements =
    typeof p.totalElements === 'number'
      ? p.totalElements
      : typeof p.total === 'number'
        ? p.total
        : items.length
  const totalPages = typeof p.totalPages === 'number' ? p.totalPages : undefined
  return { items, page, size, totalElements, totalPages }
}

export async function listProviderSecrets(
  params?: SearchAiProviderSecretsParams
): Promise<AiProviderSecretPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.providerSecrets(params))
  return normalizePage(res)
}

export async function getProviderSecret(id: string): Promise<AiProviderSecret> {
  return apiClient.get<AiProviderSecret>(AI_AGENT_ADMIN_ENDPOINTS.providerSecret(id))
}

export async function saveProviderSecret(
  body: SaveAiProviderSecretPayload
): Promise<AiProviderSecret> {
  return apiClient.post<AiProviderSecret>(AI_AGENT_ADMIN_ENDPOINTS.providerSecrets(), body)
}

export async function rotateProviderSecret(
  id: string,
  body: RotateAiProviderSecretPayload
): Promise<AiProviderSecret> {
  return apiClient.put<AiProviderSecret>(
    AI_AGENT_ADMIN_ENDPOINTS.rotateProviderSecret(id),
    body
  )
}

export async function deactivateProviderSecret(id: string): Promise<AiProviderSecret> {
  return apiClient.patch<AiProviderSecret>(
    AI_AGENT_ADMIN_ENDPOINTS.deactivateProviderSecret(id)
  )
}
