import { apiPath } from '@/shared/lib/api-paths'

export const AI_ROUTING_ENDPOINTS = {
  list: (params?: { org_id?: string; agent_id?: string; active?: boolean }) => {
    const q = new URLSearchParams()
    if (params?.org_id) q.set('org_id', params.org_id)
    if (params?.agent_id) q.set('agent_id', params.agent_id)
    if (params?.active !== undefined) q.set('active', String(params.active))
    const qs = q.toString()
    return apiPath(`/admin/ai-routing-rules${qs ? `?${qs}` : ''}`)
  },
  create: () => apiPath('/admin/ai-routing-rules'),
  detail: (ruleId: string) => apiPath(`/admin/ai-routing-rules/${ruleId}`),
  dryRun: () => apiPath('/admin/ai-routing-rules/dry-run'),
} as const
