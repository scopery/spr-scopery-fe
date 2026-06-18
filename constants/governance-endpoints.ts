/**
 * Governance API endpoints.
 */
const getBaseUrl = () =>
  typeof process !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '')
    : ''

const v2 = (path: string) => `${getBaseUrl()}/api/v2${path}`

export const GOVERNANCE_ENDPOINTS = {
  status: (orgId: string) => v2(`/orgs/${orgId}/governance/status`),
  metadata: (orgId: string) => v2(`/orgs/${orgId}/governance/metadata`),
  validateConditions: (orgId: string) => v2(`/orgs/${orgId}/governance/conditions/validate`),
  policies: (
    orgId: string,
    params?: {
      status?: string
      scope_type?: string
      project_id?: string
      preset_key?: string
      search?: string
      include_archived?: boolean
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.status) p.set('status', params.status)
    if (params?.scope_type) p.set('scope_type', params.scope_type)
    if (params?.project_id) p.set('project_id', params.project_id)
    if (params?.preset_key) p.set('preset_key', params.preset_key)
    if (params?.search) p.set('search', params.search)
    if (params?.include_archived != null) p.set('include_archived', String(params.include_archived))
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return v2(`/orgs/${orgId}/governance/policies`) + (q ? `?${q}` : '')
  },
  createPolicy: (orgId: string) => v2(`/orgs/${orgId}/governance/policies`),
  policy: (orgId: string, policyId: string) => v2(`/orgs/${orgId}/governance/policies/${policyId}`),
  archivePolicy: (orgId: string, policyId: string) =>
    v2(`/orgs/${orgId}/governance/policies/${policyId}/archive`),
  createRule: (orgId: string, policyId: string) =>
    v2(`/orgs/${orgId}/governance/policies/${policyId}/rules`),
  patchRule: (orgId: string, ruleId: string) => v2(`/orgs/${orgId}/governance/rules/${ruleId}`),
  archiveRule: (orgId: string, ruleId: string) =>
    v2(`/orgs/${orgId}/governance/rules/${ruleId}/archive`),
  evaluate: (orgId: string) => v2(`/orgs/${orgId}/governance/evaluate`),
  presets: (orgId: string) => v2(`/orgs/${orgId}/governance/presets`),
  presetPreview: (orgId: string, presetKey: string) =>
    v2(`/orgs/${orgId}/governance/presets/${encodeURIComponent(presetKey)}/preview`),
  applyPreset: (orgId: string) => v2(`/orgs/${orgId}/governance/presets/apply`),
} as const
