import { apiPath } from '@/shared/lib/api-paths'

export const AI_BUDGETS_ENDPOINTS = {
  overview: (_orgId: string) => apiPath(`/ai-agent/usage-policies`),
  list: (_orgId: string, params?: { active?: boolean }) => {
    const query = params?.active !== undefined ? `?active=${params.active}` : ''
    return apiPath(`/ai-agent/usage-policies${query}`)
  },
  create: (_orgId: string) => apiPath(`/ai-agent/usage-policies`),
  detail: (_orgId: string, budgetId: string) => apiPath(`/ai-agent/usage-policies/${budgetId}`),
  deactivate: (orgId: string, budgetId: string) =>
    apiPath(`/ai-agent/usage-policies/${budgetId}`),
} as const
