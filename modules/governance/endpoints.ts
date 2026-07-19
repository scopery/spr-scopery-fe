import { apiPath } from '@/shared/lib/api-paths'

/**
 * Governance
 * Description: Org-level governance engine: evaluate policies, manage rules,
 *              apply presets, and validate conditions for document workflows.
 */
export const GOVERNANCE_ENDPOINTS = {
  /* --- Status & metadata --- */
  status: (orgId: string) => apiPath(`/workspaces/${orgId}/governance/status`),
  metadata: (orgId: string) => apiPath(`/workspaces/${orgId}/governance/metadata`),
  validateConditions: (orgId: string) => apiPath(`/workspaces/${orgId}/governance/conditions/validate`),
  evaluate: (orgId: string) => apiPath(`/workspaces/${orgId}/governance/evaluate`),

  /* --- Policies --- */
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
    return apiPath(`/workspaces/${orgId}/governance/policies`) + (q ? `?${q}` : '')
  },
  createPolicy: (orgId: string) => apiPath(`/workspaces/${orgId}/governance/policies`),
  policy: (orgId: string, policyId: string) =>
    apiPath(`/workspaces/${orgId}/governance/policies/${policyId}`),
  archivePolicy: (orgId: string, policyId: string) =>
    apiPath(`/workspaces/${orgId}/governance/policies/${policyId}/archive`),

  /* --- Rules --- */
  createRule: (orgId: string, policyId: string) =>
    apiPath(`/workspaces/${orgId}/governance/policies/${policyId}/rules`),
  patchRule: (orgId: string, ruleId: string) =>
    apiPath(`/workspaces/${orgId}/governance/rules/${ruleId}`),
  archiveRule: (orgId: string, ruleId: string) =>
    apiPath(`/workspaces/${orgId}/governance/rules/${ruleId}/archive`),

  /* --- Presets --- */
  presets: (orgId: string) => apiPath(`/workspaces/${orgId}/governance/presets`),
  presetPreview: (orgId: string, presetKey: string) =>
    apiPath(`/workspaces/${orgId}/governance/presets/${encodeURIComponent(presetKey)}/preview`),
  applyPreset: (orgId: string) => apiPath(`/workspaces/${orgId}/governance/presets/apply`),
} as const
