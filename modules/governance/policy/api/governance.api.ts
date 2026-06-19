import { GOVERNANCE_ENDPOINTS } from './endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  GovernanceConditionValidationResult,
  GovernanceEvaluateResult,
  GovernanceMetadataResult,
  GovernancePolicy,
  GovernancePolicyListItem,
  GovernancePreset,
  GovernancePresetPreviewResult,
  GovernanceRule,
  GovernanceStatusResult,
} from '../model/governance-types'

export async function listGovernancePolicies(
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
): Promise<{ items: GovernancePolicyListItem[]; total: number }> {
  return apiClient.get(GOVERNANCE_ENDPOINTS.policies(orgId, params))
}

export async function getGovernanceStatus(orgId: string): Promise<GovernanceStatusResult> {
  return apiClient.get(GOVERNANCE_ENDPOINTS.status(orgId))
}

export async function getGovernanceMetadata(orgId: string): Promise<GovernanceMetadataResult> {
  return apiClient.get(GOVERNANCE_ENDPOINTS.metadata(orgId))
}

export async function validateGovernanceConditions(
  orgId: string,
  conditions: { all?: unknown[]; any?: unknown[] }
): Promise<GovernanceConditionValidationResult> {
  return apiClient.post(GOVERNANCE_ENDPOINTS.validateConditions(orgId), { conditions })
}

export async function previewGovernancePreset(
  orgId: string,
  presetKey: string
): Promise<GovernancePresetPreviewResult> {
  return apiClient.get(GOVERNANCE_ENDPOINTS.presetPreview(orgId, presetKey))
}

export async function getGovernancePolicy(
  orgId: string,
  policyId: string
): Promise<{ policy: GovernancePolicy; rules: GovernanceRule[] }> {
  return apiClient.get(GOVERNANCE_ENDPOINTS.policy(orgId, policyId))
}

export async function createGovernancePolicy(
  orgId: string,
  body: {
    policy_key: string
    name: string
    description?: string
    scope_type: 'org' | 'project'
    project_id?: string
    status?: 'active' | 'inactive'
    priority?: number
  }
): Promise<GovernancePolicy> {
  return apiClient.post(GOVERNANCE_ENDPOINTS.createPolicy(orgId), body)
}

export async function archiveGovernancePolicy(
  orgId: string,
  policyId: string
): Promise<GovernancePolicy> {
  return apiClient.post(GOVERNANCE_ENDPOINTS.archivePolicy(orgId, policyId), {})
}

export async function createGovernanceRule(
  orgId: string,
  policyId: string,
  body: {
    rule_key: string
    name: string
    description?: string
    action_key: string
    effect: 'allow' | 'warn' | 'deny'
    priority?: number
    status?: 'active' | 'inactive'
    conditions: { all?: unknown[]; any?: unknown[] }
    explanation_template?: string
  }
): Promise<GovernanceRule> {
  return apiClient.post(GOVERNANCE_ENDPOINTS.createRule(orgId, policyId), body)
}

export async function archiveGovernanceRule(
  orgId: string,
  ruleId: string
): Promise<GovernanceRule> {
  return apiClient.post(GOVERNANCE_ENDPOINTS.archiveRule(orgId, ruleId), {})
}

export async function listGovernancePresets(orgId: string): Promise<{ items: GovernancePreset[] }> {
  return apiClient.get(GOVERNANCE_ENDPOINTS.presets(orgId))
}

export async function applyGovernancePreset(
  orgId: string,
  body: { preset_key: string; project_id?: string; activate?: boolean }
): Promise<{ policy: GovernancePolicy; rules: GovernanceRule[] }> {
  return apiClient.post(GOVERNANCE_ENDPOINTS.applyPreset(orgId), body)
}

export async function evaluateGovernance(
  orgId: string,
  body: {
    action_key: string
    project_id?: string
    actor?: { actor_role?: string; project_role?: string; partner_access?: boolean }
    resource?: Record<string, unknown>
    request?: Record<string, unknown>
  }
): Promise<GovernanceEvaluateResult> {
  return apiClient.post(GOVERNANCE_ENDPOINTS.evaluate(orgId), body)
}

export type {
  GovernancePolicy,
  GovernanceRule,
  GovernancePolicyListItem,
  GovernancePreset,
  GovernanceStatusResult,
  GovernanceEvaluateResult,
  GovernancePresetPreviewResult,
} from '../model/governance'
