import { apiPath } from '@/shared/lib/api-paths'

export const ADMIN_AI_ENDPOINTS = {
  configs: {
    list: () => apiPath('/admin/ai/configs'),
    detail: (purpose: string) => apiPath(`/admin/ai/configs/${purpose}`),
    testRun: (purpose: string) => apiPath(`/admin/ai/configs/${purpose}/test-run`),
  },

  runs: {
    list: (params?: { purpose?: string; status?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams()
      if (params?.purpose) q.append('purpose', params.purpose)
      if (params?.status) q.append('status', params.status)
      if (params?.limit) q.append('limit', String(params.limit))
      if (params?.offset) q.append('offset', String(params.offset))
      const qs = q.toString()
      return apiPath(`/admin/ai/runs${qs ? `?${qs}` : ''}`)
    },
    detail: (runId: string) => apiPath(`/admin/ai/runs/${runId}`),
  },
} as const
