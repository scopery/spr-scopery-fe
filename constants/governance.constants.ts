export const GOVERNANCE_CONDITION_FIELDS = [
  'actor_role',
  'project_role',
  'document_type',
  'workflow_status',
  'target_workflow_status',
  'readiness_status',
  'lifecycle_status',
  'document_origin_type',
  'generated_by_ai',
  'has_evidence_links',
  'include_archived_documents',
  'source_entity_type',
  'deliverable_type',
  'template_key',
  'partner_access',
  'export_format',
  'package_format',
  'selected_document_count',
  'project_id',
  'org_id',
] as const

export const GOVERNANCE_CONDITION_OPERATORS = [
  'equals',
  'not_equals',
  'in',
  'not_in',
  'exists',
  'not_exists',
  'boolean_is',
] as const

export const GOVERNANCE_ACTION_KEYS = [
  'document.create',
  'document.update',
  'document.archive',
  'document.restore',
  'document.export',
  'document.workflow.transition',
  'document.link.create',
  'document.link.delete',
  'document.deliverable.preview',
  'document.deliverable.create',
  'document.template.use',
  'document.partner.view',
  'document.handoff.export',
] as const

export const GOVERNANCE_EFFECTS = ['allow', 'warn', 'deny'] as const

export const SAMPLE_GOVERNANCE_CONDITION = {
  all: [{ field: 'readiness_status', operator: 'not_equals', value: 'blocked' }],
} as const

export const GOVERNANCE_SIMULATOR_SCENARIOS = [
  {
    key: 'export_blocked_readiness',
    label: 'Export blocked by readiness',
    payload: {
      action_key: 'document.export',
      resource: { readiness_status: 'blocked', workflow_status: 'draft' },
    },
  },
  {
    key: 'partner_approved_handoff',
    label: 'Partner viewing approved handoff',
    payload: {
      action_key: 'document.handoff.export',
      actor: { partner_access: true },
      resource: { workflow_status: 'approved', readiness_status: 'ready' },
    },
  },
  {
    key: 'template_deprecated_warning',
    label: 'Template deprecated warning',
    payload: {
      action_key: 'document.template.use',
      resource: { template_key: 'legacy_brd_v1', document_type: 'business_requirements_document' },
    },
  },
  {
    key: 'workflow_transition_approved',
    label: 'Workflow transition to approved',
    payload: {
      action_key: 'document.workflow.transition',
      resource: { workflow_status: 'in_review' },
      request: { target_workflow_status: 'approved' },
    },
  },
  {
    key: 'include_archived_warning',
    label: 'Include archived documents warning',
    payload: {
      action_key: 'document.export',
      request: { include_archived_documents: true, selected_document_count: 3 },
    },
  },
] as const
