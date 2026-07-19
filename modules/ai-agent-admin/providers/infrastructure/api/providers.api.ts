import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from '../../../infrastructure/api/endpoints'
import type {
  AiProvider,
  AiProviderPage,
  CreateAiProviderPayload,
  SearchAiProvidersParams,
  UpdateAiProviderPayload,
} from '../../domain/model/provider'

function normalizePage(res: unknown): AiProviderPage {
  if (!res || typeof res !== 'object') {
    return { items: [], page: 0, size: 20, totalElements: 0 }
  }
  const p = res as Record<string, unknown>
  const items = Array.isArray(p.items)
    ? (p.items as AiProvider[])
    : Array.isArray(p.content)
      ? (p.content as AiProvider[])
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

export async function listProviders(
  params?: SearchAiProvidersParams
): Promise<AiProviderPage> {
  const res = await apiClient.get<unknown>(AI_AGENT_ADMIN_ENDPOINTS.providers(params))
  return normalizePage(res)
}

export async function getProvider(id: string): Promise<AiProvider> {
  return apiClient.get<AiProvider>(AI_AGENT_ADMIN_ENDPOINTS.provider(id))
}

export async function createProvider(body: CreateAiProviderPayload): Promise<AiProvider> {
  return apiClient.post<AiProvider>(AI_AGENT_ADMIN_ENDPOINTS.providers(), body)
}

export async function updateProvider(
  id: string,
  body: UpdateAiProviderPayload
): Promise<AiProvider> {
  return apiClient.put<AiProvider>(AI_AGENT_ADMIN_ENDPOINTS.provider(id), body)
}

export async function activateProvider(id: string): Promise<AiProvider> {
  return apiClient.patch<AiProvider>(AI_AGENT_ADMIN_ENDPOINTS.activateProvider(id))
}

export async function deactivateProvider(id: string): Promise<AiProvider> {
  return apiClient.patch<AiProvider>(AI_AGENT_ADMIN_ENDPOINTS.deactivateProvider(id))
}
