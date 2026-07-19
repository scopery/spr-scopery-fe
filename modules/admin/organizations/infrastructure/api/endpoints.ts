import { apiPath } from '@/shared/lib/api-paths'
import type { SearchOrganizationsParams } from '../../domain/model/organization'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

const base = () => apiPath('/organizations')

export const ORGANIZATION_ENDPOINTS = {
  create: () => base(),
  get: (orgId: string) => apiPath(`/organizations/${orgId}`),
  search: (params?: SearchOrganizationsParams) =>
    withQuery(base(), params as Record<string, string | number | boolean | undefined>),
  update: (orgId: string) => apiPath(`/organizations/${orgId}`),
  activate: (orgId: string) => apiPath(`/organizations/${orgId}/activate`),
  archive: (orgId: string) => apiPath(`/organizations/${orgId}/archive`),
} as const
