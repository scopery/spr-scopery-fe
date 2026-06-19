/**
 * Document evidence link types — aligned with BE document_links API
 */

export type DocumentLinkedEntityType = 'session' | 'answer' | 'requirement' | 'trace_item'

export type DocumentRelationType =
  | 'evidence_for'
  | 'summary_of'
  | 'generated_from'
  | 'related_to'
  | 'source_for'
  | 'handoff_for'
  | 'supports'
  | 'derived_from'

export interface DocumentLink {
  id: string
  org_id: string
  project_id: string | null
  document_id: string
  linked_entity_type: DocumentLinkedEntityType
  linked_entity_id: string
  relation_type: DocumentRelationType
  title_snapshot: string | null
  metadata_json: Record<string, unknown> | null
  created_by: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface LinkedDocumentForEntity extends DocumentLink {
  document_title: string
  document_status: string
  document_type: string
  workflow_status: string
}

export const DOCUMENT_LINKED_ENTITY_LABELS: Record<DocumentLinkedEntityType, string> = {
  session: 'Session',
  answer: 'Answer',
  requirement: 'Requirement',
  trace_item: 'Trace link',
}

export const DOCUMENT_RELATION_LABELS: Record<DocumentRelationType, string> = {
  evidence_for: 'Evidence for',
  summary_of: 'Summary of',
  generated_from: 'Generated from',
  related_to: 'Related to',
  source_for: 'Source for',
  handoff_for: 'Handoff for',
  supports: 'Supports',
  derived_from: 'Derived from',
}

export const DOCUMENT_RELATION_OPTIONS: { value: DocumentRelationType; label: string }[] = [
  { value: 'evidence_for', label: 'Evidence for' },
  { value: 'summary_of', label: 'Summary of' },
  { value: 'generated_from', label: 'Generated from' },
  { value: 'related_to', label: 'Related to' },
  { value: 'source_for', label: 'Source for' },
  { value: 'handoff_for', label: 'Handoff for' },
  { value: 'supports', label: 'Supports' },
  { value: 'derived_from', label: 'Derived from' },
]

export const DOCUMENT_LINK_ENTITY_OPTIONS: { value: DocumentLinkedEntityType; label: string }[] = [
  { value: 'session', label: 'Session' },
  { value: 'answer', label: 'Answer' },
  { value: 'requirement', label: 'Requirement' },
  { value: 'trace_item', label: 'Trace link' },
]
