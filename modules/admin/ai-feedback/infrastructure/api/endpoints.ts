import { apiPath } from '@/shared/lib/api-paths'

export const AI_FEEDBACK_ENDPOINTS = {
  submitFeedback: (orgId: string, runId: string) =>
    apiPath(`/ai-agent/executions/${runId}`),

  quality: {
    summary: (agentId: string, orgId?: string) => {
      const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
      return apiPath(`/admin/ai-agents/${agentId}/quality/summary${qs}`)
    },
    feedback: (
      agentId: string,
      params?: {
        org_id?: string
        rating?: string
        status?: string
        limit?: number
        offset?: number
      }
    ) => {
      const q = new URLSearchParams()
      if (params?.org_id) q.set('org_id', params.org_id)
      if (params?.rating) q.set('rating', params.rating)
      if (params?.status) q.set('status', params.status)
      if (params?.limit != null) q.set('limit', String(params.limit))
      if (params?.offset != null) q.set('offset', String(params.offset))
      const qs = q.toString()
      return apiPath(`/admin/ai-agents/${agentId}/quality/feedback${qs ? `?${qs}` : ''}`)
    },
    versions: (agentId: string, orgId?: string) => {
      const qs = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
      return apiPath(`/admin/ai-agents/${agentId}/quality/versions${qs}`)
    },
  },

  updateStatus: (feedbackId: string) => apiPath(`/admin/ai-feedback/${feedbackId}/status`),
} as const
