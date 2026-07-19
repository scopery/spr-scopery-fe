import { apiPath } from '@/shared/lib/api-paths'
import type { SearchPhaseDefinitionsParams } from '../../domain/model/phase-definition'

function withQuery(base: string, params?: Record<string, string | number | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') p.set(k, String(v))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

export const PHASE_DEFINITION_ENDPOINTS = {
  search: (params?: SearchPhaseDefinitionsParams) => {
    const base = apiPath('/phase-definitions')
    if (!params) return base
    const p = new URLSearchParams()
    if (params.scope) p.set('scope', params.scope)
    if (params.organizationId) p.set('organizationId', params.organizationId)
    if (params.workspaceId) p.set('workspaceId', params.workspaceId)
    if (params.keyword) p.set('keyword', params.keyword)
    if (params.status) p.set('status', params.status)
    if (params.page != null) p.set('page', String(params.page))
    if (params.size != null) p.set('size', String(params.size))
    const q = p.toString()
    return q ? `${base}?${q}` : base
  },
  /** @deprecated use search() */
  list: (params?: {
    scope?: string
    organizationId?: string
    workspaceId?: string
    keyword?: string
    status?: string
    page?: number
    size?: number
  }) => withQuery(apiPath('/phase-definitions'), params),
  get: (id: string) => apiPath(`/phase-definitions/${id}`),
  createSystem: () => apiPath('/phase-definitions/system'),
  createOrg: () => apiPath('/phase-definitions/organization'),
  createWorkspace: (workspaceId: string) =>
    withQuery(apiPath('/phase-definitions'), { workspaceId }),
  update: (id: string) => apiPath(`/phase-definitions/${id}`),
  activate: (id: string) => apiPath(`/phase-definitions/${id}/activate`),
  deactivate: (id: string) => apiPath(`/phase-definitions/${id}/deactivate`),
  archive: (id: string) => apiPath(`/phase-definitions/${id}/archive`),
} as const
