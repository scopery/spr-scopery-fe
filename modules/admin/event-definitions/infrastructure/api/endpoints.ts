import { apiPath } from '@/shared/lib/api-paths'
import type { SearchEventDefinitionsParams } from '../../domain/model/event-definition'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

const base = () => apiPath('/event-definitions')

export const EVENT_DEFINITION_ENDPOINTS = {
  create: () => base(),
  get: (id: string) => apiPath(`/event-definitions/${id}`),
  search: (params?: SearchEventDefinitionsParams) =>
    withQuery(base(), params as Record<string, string | number | boolean | undefined>),
  update: (id: string) => apiPath(`/event-definitions/${id}`),
  activate: (id: string) => apiPath(`/event-definitions/${id}/activate`),
  deactivate: (id: string) => apiPath(`/event-definitions/${id}/deactivate`),
  deprecate: (id: string) => apiPath(`/event-definitions/${id}/deprecate`),
  upsertVariables: (id: string) => apiPath(`/event-definitions/${id}/variables`),
  listVariables: (id: string) => apiPath(`/event-definitions/${id}/variables`),
} as const
