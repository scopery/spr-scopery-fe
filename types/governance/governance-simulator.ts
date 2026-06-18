import type { GovernanceEvaluateResult } from '@/types/governance'

export interface GovernanceSimulatorFormState {
  action_key: string
  project_id: string
  actor_role: string
  project_role: string
  partner_access: string
  document_type: string
  workflow_status: string
  target_workflow_status: string
  readiness_status: string
  lifecycle_status: string
  document_origin_type: string
  generated_by_ai: string
  has_evidence_links: string
  include_archived_documents: string
  source_entity_type: string
  deliverable_type: string
  template_key: string
  export_format: string
  package_format: string
  selected_document_count: string
}

export interface GovernanceEvaluateRequestPayload {
  action_key: string
  project_id?: string
  actor?: {
    actor_role?: string
    project_role?: string
    partner_access?: boolean
  }
  resource?: Record<string, unknown>
  request?: Record<string, unknown>
}

export interface GovernanceSimulatorSelectOption {
  value: string
  label: string
}

export interface GovernanceSimulatorViewProps {
  canViewRuleDetails: boolean
  form: GovernanceSimulatorFormState
  loading: boolean
  error: string | null
  result: GovernanceEvaluateResult | null
  scenarioOptions: GovernanceSimulatorSelectOption[]
  actionKeyOptions: GovernanceSimulatorSelectOption[]
  onScenarioSelect: (key: string) => void
  onFormFieldChange: (field: keyof GovernanceSimulatorFormState, value: string) => void
  onEvaluate: () => void
  onReset: () => void
}
