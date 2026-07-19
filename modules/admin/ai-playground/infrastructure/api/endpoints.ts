import { apiPath } from '@/shared/lib/api-paths'

export const AI_PLAYGROUND_ENDPOINTS = {
  context: (agentId: string, orgId?: string) => {
    const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
    return apiPath(`/admin/ai-agents/${agentId}/playground${qs}`)
  },
  dryRun: (agentId: string) => apiPath(`/admin/ai-agents/${agentId}/playground/dry-run`),
  run: (agentId: string) => apiPath(`/admin/ai-agents/${agentId}/playground/run`),
} as const
