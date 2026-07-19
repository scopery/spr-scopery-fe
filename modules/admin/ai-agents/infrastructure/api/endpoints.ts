import { apiPath } from '@/shared/lib/api-paths'

type OrgFilter = { orgId?: string }

type UsageSummaryParams = {
  org_id: string
  date_from?: string
  date_to?: string
  status?: string
  mode?: string
  model_id?: string
}

type RunLogsParams = UsageSummaryParams & {
  user_id?: string
  limit?: number
  offset?: number
}

function orgQuery(orgId?: string): string {
  return orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
}

export const AI_AGENTS_ENDPOINTS = {
  summary: (p?: OrgFilter) => apiPath(`/admin/ai-agents/summary${orgQuery(p?.orgId)}`),
  list: (p?: OrgFilter) => apiPath(`/admin/ai-agents${orgQuery(p?.orgId)}`),
  detail: (agentId: string, p?: OrgFilter) =>
    apiPath(`/admin/ai-agents/${agentId}${orgQuery(p?.orgId)}`),
  models: () => apiPath('/admin/ai-models'),

  versions: {
    draftFromPublished: (agentId: string) =>
      apiPath(`/admin/ai-agents/${agentId}/versions/draft-from-published`),
    detail: (agentId: string, versionId: string) =>
      apiPath(`/admin/ai-agents/${agentId}/versions/${versionId}`),
    publish: (agentId: string, versionId: string) =>
      apiPath(`/admin/ai-agents/${agentId}/versions/${versionId}/publish`),
    archive: (agentId: string, versionId: string) =>
      apiPath(`/admin/ai-agents/${agentId}/versions/${versionId}/archive`),
  },

  usageSummary: (agentId: string, params: UsageSummaryParams) => {
    const q = new URLSearchParams({ org_id: params.org_id })
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    if (params.status) q.set('status', params.status)
    if (params.mode) q.set('mode', params.mode)
    if (params.model_id) q.set('model_id', params.model_id)
    return apiPath(`/admin/ai-agents/${agentId}/usage-summary?${q.toString()}`)
  },
  runLogs: (agentId: string, params: RunLogsParams) => {
    const q = new URLSearchParams({ org_id: params.org_id })
    if (params.date_from) q.set('date_from', params.date_from)
    if (params.date_to) q.set('date_to', params.date_to)
    if (params.status) q.set('status', params.status)
    if (params.mode) q.set('mode', params.mode)
    if (params.model_id) q.set('model_id', params.model_id)
    if (params.user_id) q.set('user_id', params.user_id)
    if (params.limit != null) q.set('limit', String(params.limit))
    if (params.offset != null) q.set('offset', String(params.offset))
    return apiPath(`/admin/ai-agents/${agentId}/run-logs?${q.toString()}`)
  },
} as const
