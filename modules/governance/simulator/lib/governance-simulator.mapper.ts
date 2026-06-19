import { GOVERNANCE_SIMULATOR_SCENARIOS } from '@/constants/governance.constants'
import type {
  GovernanceEvaluateRequestPayload,
  GovernanceSimulatorFormState,
} from '@/modules/governance/simulator'

export const DEFAULT_GOVERNANCE_SIMULATOR_FORM: GovernanceSimulatorFormState = {
  action_key: 'document.export',
  project_id: '',
  actor_role: '',
  project_role: '',
  partner_access: 'false',
  document_type: '',
  workflow_status: 'draft',
  target_workflow_status: '',
  readiness_status: '',
  lifecycle_status: '',
  document_origin_type: '',
  generated_by_ai: '',
  has_evidence_links: '',
  include_archived_documents: 'false',
  source_entity_type: '',
  deliverable_type: '',
  template_key: '',
  export_format: '',
  package_format: '',
  selected_document_count: '',
}

export function parseOptionalBool(value: string): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export function buildGovernanceEvaluatePayload(
  form: GovernanceSimulatorFormState
): GovernanceEvaluateRequestPayload {
  return {
    action_key: form.action_key,
    project_id: form.project_id.trim() || undefined,
    actor: {
      actor_role: form.actor_role.trim() || undefined,
      project_role: form.project_role.trim() || undefined,
      partner_access: parseOptionalBool(form.partner_access),
    },
    resource: {
      document_type: form.document_type.trim() || undefined,
      workflow_status: form.workflow_status.trim() || undefined,
      readiness_status: form.readiness_status.trim() || undefined,
      lifecycle_status: form.lifecycle_status.trim() || undefined,
      document_origin_type: form.document_origin_type.trim() || undefined,
      generated_by_ai: parseOptionalBool(form.generated_by_ai),
      has_evidence_links: parseOptionalBool(form.has_evidence_links),
      source_entity_type: form.source_entity_type.trim() || undefined,
      deliverable_type: form.deliverable_type.trim() || undefined,
      template_key: form.template_key.trim() || undefined,
    },
    request: {
      include_archived_documents: parseOptionalBool(form.include_archived_documents),
      target_workflow_status: form.target_workflow_status.trim() || undefined,
      export_format: form.export_format.trim() || undefined,
      package_format: form.package_format.trim() || undefined,
      selected_document_count: form.selected_document_count
        ? Number(form.selected_document_count)
        : undefined,
    },
  }
}

type ScenarioPayload = (typeof GOVERNANCE_SIMULATOR_SCENARIOS)[number]['payload']

export function scenarioPayloadToForm(payload: ScenarioPayload): GovernanceSimulatorFormState {
  const actor = 'actor' in payload ? payload.actor : undefined
  const resource = 'resource' in payload ? payload.resource : undefined
  const request = 'request' in payload ? payload.request : undefined

  return {
    ...DEFAULT_GOVERNANCE_SIMULATOR_FORM,
    action_key: payload.action_key,
    partner_access: String(actor?.partner_access ?? false),
    workflow_status:
      resource && 'workflow_status' in resource ? String(resource.workflow_status) : '',
    readiness_status:
      resource && 'readiness_status' in resource ? String(resource.readiness_status) : '',
    template_key: resource && 'template_key' in resource ? String(resource.template_key) : '',
    include_archived_documents: String(
      request && 'include_archived_documents' in request
        ? request.include_archived_documents
        : false
    ),
    target_workflow_status:
      request && 'target_workflow_status' in request ? String(request.target_workflow_status) : '',
    selected_document_count:
      request &&
      'selected_document_count' in request &&
      request.selected_document_count !== undefined
        ? String(request.selected_document_count)
        : '',
  }
}
