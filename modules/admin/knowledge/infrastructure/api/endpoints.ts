import { apiPath } from '@/shared/lib/api-paths'
import type { SearchDocumentTypesParams } from '../../domain/model/document-type'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

const base = () => apiPath('/knowledge/document-types')

export const DOCUMENT_TYPE_ENDPOINTS = {
  createSystem: () => apiPath('/knowledge/document-types/system'),
  createWorkspace: () => apiPath('/knowledge/document-types/workspace'),
  get: (id: string) => apiPath(`/knowledge/document-types/${id}`),
  search: (params?: SearchDocumentTypesParams) =>
    withQuery(base(), params as Record<string, string | number | boolean | undefined>),
  update: (id: string) => apiPath(`/knowledge/document-types/${id}`),
  activate: (id: string) => apiPath(`/knowledge/document-types/${id}/activate`),
  deactivate: (id: string) => apiPath(`/knowledge/document-types/${id}/deactivate`),
  softDelete: (id: string) => apiPath(`/knowledge/document-types/${id}/soft-delete`),
} as const
