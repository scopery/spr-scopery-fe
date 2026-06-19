import type { DocumentType, DocumentWorkflowStatus } from '@/modules/documents/document'

export type DeliverableType =
  | 'project_brief'
  | 'elicitation_summary'
  | 'requirement_brief'
  | 'handoff_summary'
  | 'evidence_index_document'
  | 'business_requirements_document'
  | 'software_requirements_specification'
  | 'decision_log'
  | 'assumption_log'
  | 'risk_log'
  | 'change_impact_note'

export type DeliverableSourceEntityType = 'project' | 'session' | 'requirement' | 'document_set'

export type DeliverableEntryContext =
  | 'project_documents'
  | 'document_hub'
  | 'requirement_evidence'
  | 'session_evidence'
  | 'document_set'

export interface DeliverableTemplateListItem {
  id: string
  template_key: string | null
  title: string
  description: string | null
  document_type: DocumentType
  deliverable_type: DeliverableType
  is_system: boolean
}

export interface DeliverableRenderWarning {
  code: string
  message: string
  field?: string
}

export interface DeliverablePreviewResult {
  title: string
  document_type: DocumentType
  workflow_status: DocumentWorkflowStatus
  content_preview: string
  content_json: unknown
  plain_text: string
  missing_placeholders: string[]
  warnings: DeliverableRenderWarning[]
  source_summary: {
    source_entity_type: DeliverableSourceEntityType | null
    source_entity_id: string | null
    project_id: string
    template_id: string
    template_key: string | null
    template_name: string
    deliverable_type: DeliverableType
  }
  linked_entities_preview: Array<{
    linked_entity_type: string
    linked_entity_id: string
    relation_type: string
    title_snapshot: string | null
  }>
  can_create: boolean
  blocking_errors: string[]
  readiness: DeliverableReadinessResult
  governance_decision?: {
    allowed: boolean
    effect: string
    action_key: string
    warnings: string[]
    blocked_reasons: string[]
    suggested_actions: string[]
    matched_rules?: Array<{
      rule_id: string
      rule_key: string
      policy_id: string
      policy_key: string
      explanation: string
    }>
    decision_id?: string
  }
}

export type DeliverableReadinessStatus = 'ready' | 'needs_review' | 'blocked'

export interface DeliverableReadinessWarning {
  code: string
  message: string
  field?: string
}

export interface DeliverableReadinessSuggestedAction {
  action: string
  label: string
}

export interface DeliverableReadinessResult {
  readiness_status: DeliverableReadinessStatus
  warnings: DeliverableReadinessWarning[]
  blocking_issues: DeliverableReadinessWarning[]
  suggested_actions: DeliverableReadinessSuggestedAction[]
  warning_count: number
  blocking_issue_count: number
}

export type DeliverableReadinessSource = 'stored' | 'recomputed'

export interface DeliverableReadinessWithMeta extends DeliverableReadinessResult {
  computed_at: string | null
  source: DeliverableReadinessSource
  stale: boolean
}

export interface DocumentDeliverableSourceEntityInfo {
  source_entity_type: DeliverableSourceEntityType | null
  source_entity_id: string | null
  source_entity_label: string | null
  source_entity_accessible: boolean
  source_entity_path: string | null
}

export interface DocumentDeliverableMetadata {
  document_id: string
  project_id: string | null
  is_generated_deliverable: boolean
  document_type: DocumentType
  workflow_status: DocumentWorkflowStatus
  origin_type: string
  generated_by_ai: boolean
  deliverable_type: DeliverableType | null
  template_id: string | null
  template_key: string | null
  template_name: string | null
  entry_point: DeliverableEntryContext | null
  selected_document_count: number | null
  source_entity: DocumentDeliverableSourceEntityInfo
  readiness: DeliverableReadinessWithMeta
}

export interface DeliverablePickerItem {
  id: string
  title: string
  document_type: DocumentType
  workflow_status: DocumentWorkflowStatus
  status: string
  updated_at: string
  project_id: string
}

export interface DeliverableHistoryItem {
  document_id: string
  title: string
  document_type: DocumentType
  workflow_status: DocumentWorkflowStatus
  status: string
  deliverable_type: DeliverableType | null
  template_key: string | null
  template_name: string | null
  source_entity_type: DeliverableSourceEntityType | null
  entry_point: DeliverableEntryContext | null
  readiness_status: DeliverableReadinessStatus | null
  warning_count: number
  blocking_issue_count: number
  readiness_stale: boolean
  readiness_computed_at: string | null
  readiness_source: DeliverableReadinessSource
  created_by_display_name: string | null
  created_at: string
  updated_at: string
}

export interface ResolveFilteredSelectionResult {
  document_ids: string[]
  document_titles: string[]
  total_count: number
  inferred_project_id: string | null
  cross_project: boolean
  blocked_reason: string | null
}

export interface CreateDeliverableResult {
  document_id: string
  title: string
  document_type: DocumentType
  workflow_status: DocumentWorkflowStatus
  origin_type: string
  origin_id: string | null
  generated_by_ai: boolean
  project_id: string
  warnings: DeliverableRenderWarning[]
  linked_entities: DeliverablePreviewResult['linked_entities_preview']
  document_path: string
  readiness: DeliverableReadinessResult
}

export interface HubDeliverableContext {
  inferred_project_id: string | null
  cross_project: boolean
  project_ids: string[]
  selected_document_count: number
  missing_document_ids: string[]
  deleted_count: number
  archived_count: number
  unattached_count: number
  blocked_reason: string | null
  deliverable_types: DeliverableType[]
}

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  project_brief: 'Project Brief',
  elicitation_summary: 'Elicitation Summary',
  requirement_brief: 'Requirement Brief',
  handoff_summary: 'Handoff Summary',
  evidence_index_document: 'Evidence Index',
  business_requirements_document: 'Business Requirements Document',
  software_requirements_specification: 'Software Requirements Specification',
  decision_log: 'Decision Log',
  assumption_log: 'Assumption Log',
  risk_log: 'Risk Log',
  change_impact_note: 'Change Impact Note',
}

export const DELIVERABLE_TYPES_BY_SOURCE: Record<DeliverableSourceEntityType, DeliverableType[]> = {
  project: [
    'project_brief',
    'handoff_summary',
    'business_requirements_document',
    'software_requirements_specification',
    'assumption_log',
    'risk_log',
    'change_impact_note',
  ],
  session: ['elicitation_summary'],
  requirement: ['requirement_brief'],
  document_set: ['evidence_index_document', 'handoff_summary', 'decision_log'],
}

export const DELIVERABLE_TYPES_REQUIRING_SOURCE: Partial<
  Record<DeliverableType, DeliverableSourceEntityType>
> = {
  elicitation_summary: 'session',
  requirement_brief: 'requirement',
}

export function getEffectiveSourceForDeliverable(
  deliverableType: DeliverableType,
  hasSelectedDocuments: boolean
): DeliverableSourceEntityType {
  if (DELIVERABLE_TYPES_REQUIRING_SOURCE[deliverableType]) {
    return DELIVERABLE_TYPES_REQUIRING_SOURCE[deliverableType] as DeliverableSourceEntityType
  }
  if (hasSelectedDocuments && DELIVERABLE_TYPES_BY_SOURCE.document_set.includes(deliverableType)) {
    return 'document_set'
  }
  return 'project'
}

export function getAvailableDeliverableTypes(
  sourceEntityType: DeliverableSourceEntityType,
  lockToType?: DeliverableType
): DeliverableType[] {
  if (lockToType) return [lockToType]
  return DELIVERABLE_TYPES_BY_SOURCE[sourceEntityType]
}
