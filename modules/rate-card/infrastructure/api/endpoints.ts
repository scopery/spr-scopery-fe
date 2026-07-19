import { apiPath } from '@/shared/lib/api-paths'

/** Builds a query string from a params object of primitives; skips undefined/null/empty values. */
function buildQuery(params?: object): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export const RATE_CARD_ENDPOINTS = {
  costRoles: {
    list: (params?: object) => apiPath(`/rate-card/cost-roles${buildQuery(params)}`),
    create: () => apiPath('/rate-card/cost-roles'),
    get: (roleId: string) => apiPath(`/rate-card/cost-roles/${roleId}`),
    update: (roleId: string) => apiPath(`/rate-card/cost-roles/${roleId}`),
    activate: (roleId: string) => apiPath(`/rate-card/cost-roles/${roleId}/activate`),
    deactivate: (roleId: string) => apiPath(`/rate-card/cost-roles/${roleId}/deactivate`),
    archive: (roleId: string) => apiPath(`/rate-card/cost-roles/${roleId}/archive`),
  },
  inflationPolicies: {
    list: (params?: object) => apiPath(`/rate-card/inflation-policies${buildQuery(params)}`),
    create: () => apiPath('/rate-card/inflation-policies'),
    get: (policyId: string) => apiPath(`/rate-card/inflation-policies/${policyId}`),
    update: (policyId: string) => apiPath(`/rate-card/inflation-policies/${policyId}`),
    activate: (policyId: string) => apiPath(`/rate-card/inflation-policies/${policyId}/activate`),
    deactivate: (policyId: string) =>
      apiPath(`/rate-card/inflation-policies/${policyId}/deactivate`),
    archive: (policyId: string) => apiPath(`/rate-card/inflation-policies/${policyId}/archive`),
  },
  memberCostRoles: {
    list: (params?: object) => apiPath(`/rate-card/member-cost-roles${buildQuery(params)}`),
    create: () => apiPath('/rate-card/member-cost-roles'),
    get: (assignmentId: string) => apiPath(`/rate-card/member-cost-roles/${assignmentId}`),
    update: (assignmentId: string) => apiPath(`/rate-card/member-cost-roles/${assignmentId}`),
    archive: (assignmentId: string) =>
      apiPath(`/rate-card/member-cost-roles/${assignmentId}/archive`),
  },
  cards: {
    list: (params?: object) => apiPath(`/rate-card/cards${buildQuery(params)}`),
    create: () => apiPath('/rate-card/cards'),
    get: (rateCardId: string) => apiPath(`/rate-card/cards/${rateCardId}`),
    update: (rateCardId: string) => apiPath(`/rate-card/cards/${rateCardId}`),
    activate: (rateCardId: string) => apiPath(`/rate-card/cards/${rateCardId}/activate`),
    deactivate: (rateCardId: string) => apiPath(`/rate-card/cards/${rateCardId}/deactivate`),
    archive: (rateCardId: string) => apiPath(`/rate-card/cards/${rateCardId}/archive`),
  },
  versions: {
    list: (rateCardId: string) => apiPath(`/rate-card/cards/${rateCardId}/versions`),
    create: (rateCardId: string) => apiPath(`/rate-card/cards/${rateCardId}/versions`),
    get: (rateCardId: string, versionId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}`),
    update: (rateCardId: string, versionId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}`),
    publish: (rateCardId: string, versionId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/publish`),
    archive: (rateCardId: string, versionId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/archive`),
    duplicate: (rateCardId: string, versionId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/duplicate`),
  },
  lines: {
    list: (rateCardId: string, versionId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/lines`),
    create: (rateCardId: string, versionId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/lines`),
    get: (rateCardId: string, versionId: string, lineId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/lines/${lineId}`),
    update: (rateCardId: string, versionId: string, lineId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/lines/${lineId}`),
    delete: (rateCardId: string, versionId: string, lineId: string) =>
      apiPath(`/rate-card/cards/${rateCardId}/versions/${versionId}/lines/${lineId}`),
  },
  resolve: () => apiPath('/rate-card/resolve'),
  previewTaskRate: () => apiPath('/rate-card/preview-task-rate'),
} as const
