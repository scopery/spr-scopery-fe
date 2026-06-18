export type GovernanceScopeType = 'org' | 'project'
export type GovernancePolicyStatus = 'active' | 'inactive' | 'archived'
export type GovernanceRuleStatus = 'active' | 'inactive' | 'archived'
export type GovernanceEffect = 'allow' | 'warn' | 'deny'

export type GovernanceActionKey =
  | 'document.create'
  | 'document.update'
  | 'document.archive'
  | 'document.restore'
  | 'document.export'
  | 'document.workflow.transition'
  | 'document.link.create'
  | 'document.link.delete'
  | 'document.deliverable.preview'
  | 'document.deliverable.create'
  | 'document.template.use'
  | 'document.partner.view'
  | 'document.handoff.export'

export interface GovernanceConditionClause {
  field: string
  operator: string
  value?: unknown
}

export interface GovernanceConditionGroup {
  all?: GovernanceConditionClause[]
  any?: GovernanceConditionClause[]
}

export interface GovernancePolicyListItem {
  id: string
  org_id: string
  project_id: string | null
  project_name: string | null
  policy_key: string
  name: string
  description: string | null
  scope_type: GovernanceScopeType
  status: GovernancePolicyStatus
  priority: number
  preset_key: string | null
  rule_count: number
  active_rule_count: number
  created_at: string
  updated_at: string
}

export interface GovernancePolicy {
  id: string
  org_id: string
  project_id: string | null
  policy_key: string
  name: string
  description: string | null
  scope_type: GovernanceScopeType
  status: GovernancePolicyStatus
  priority: number
  preset_key: string | null
  created_at: string
  updated_at: string
}

export interface GovernanceRule {
  id: string
  policy_id: string
  rule_key: string
  name: string
  description: string | null
  action_key: GovernanceActionKey
  effect: GovernanceEffect
  priority: number
  status: GovernanceRuleStatus
  conditions: GovernanceConditionGroup
  explanation_template: string | null
  created_at: string
  updated_at: string
}

export interface GovernancePreset {
  preset_key: string
  name: string
  description: string
  scope_type: GovernanceScopeType
  policy_key: string
  priority: number
  rules: Array<{
    rule_key: string
    name: string
    description: string
    action_key: GovernanceActionKey
    effect: GovernanceEffect
    priority: number
    conditions: GovernanceConditionGroup
    explanation_template: string
  }>
}

export interface GovernanceEvaluateResult {
  allowed: boolean
  effect: GovernanceEffect
  matched_rules: Array<{
    rule_id: string
    rule_key: string
    policy_id: string
    policy_key: string
    action_key: GovernanceActionKey
    effect: GovernanceEffect
    priority: number
    explanation: string
  }>
  warnings: string[]
  blocked_reasons: string[]
  suggested_actions: string[]
}

export interface GovernanceStatusResult {
  enforcement_enabled: boolean
  active_policy_count: number
  active_rule_count: number
  inactive_policy_count: number
  message: string
}

export interface GovernanceConditionValidationResult {
  valid: boolean
  errors: string[]
  normalized?: GovernanceConditionGroup
}

export interface GovernancePresetPreviewResult {
  preset_key: string
  name: string
  description: string
  scope_type: GovernanceScopeType
  policy_key: string
  priority: number
  default_status: 'active' | 'inactive'
  rules: GovernancePreset['rules']
  actions_affected: GovernanceActionKey[]
  effects_used: GovernanceEffect[]
}

export interface GovernanceMetadataResult {
  condition_fields: string[]
  condition_operators: string[]
  action_keys: GovernanceActionKey[]
  effects: GovernanceEffect[]
}
