/**
 * Document domain types — aligned with BE documents API
 */

export type DocumentType =
  | 'note'
  | 'meeting_note'
  | 'decision'
  | 'research'
  | 'summary'
  | 'project_doc'
  | 'project_brief'
  | 'elicitation_summary'
  | 'requirement_brief'
  | 'business_requirements_document'
  | 'software_requirements_specification'
  | 'decision_log'
  | 'assumption_log'
  | 'risk_log'
  | 'change_impact_note'
  | 'traceability_report'
  | 'handoff_document'
  | 'uploaded_reference'
  | 'generated_draft'
  | 'other'

export type DocumentWorkflowStatus = 'draft' | 'in_review' | 'approved'

export type DocumentVisibility = 'private' | 'workspace' | 'project' | 'shared'

export type DocumentStatus = 'active' | 'archived' | 'deleted'

export type DocumentOriginType =
  | 'manual'
  | 'imported'
  | 'ai_generated'
  | 'qa_session'
  | 'clarity_assessment'
  | 'readiness_summary'
  | 'from_template'
  | 'project_summary'
  | 'document_summary'
  | 'template_generated'

/** Phase 1 plain content — replaceable by Plate JSON in Phase 2 */
export interface PlainDocumentContent {
  format: 'plain'
  body: string
}

export interface Document {
  id: string
  org_id: string
  title: string
  content: PlainDocumentContent | { format: 'plate'; value: unknown[] }
  plain_text: string
  document_type: DocumentType
  visibility: DocumentVisibility
  status: DocumentStatus
  workflow_status: DocumentWorkflowStatus
  origin_type: DocumentOriginType
  origin_id: string | null
  generated_by_ai?: boolean
  ai_metadata?: Record<string, unknown> | null
  source_summary?: Record<string, unknown> | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ProjectDocumentListItem {
  link_id: string
  project_id: string
  document_id: string
  section_id: string | null
  pinned: boolean
  display_order: number
  title: string
  plain_text: string
  document_type: DocumentType
  visibility: DocumentVisibility
  status: DocumentStatus
  workflow_status: DocumentWorkflowStatus
  origin_type: DocumentOriginType
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  creator_display_name: string | null
  link_count?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  page: { limit: number; offset: number; total: number }
}

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'project_brief', label: 'Project brief' },
  { value: 'meeting_note', label: 'Meeting note' },
  { value: 'elicitation_summary', label: 'Elicitation summary' },
  { value: 'requirement_brief', label: 'Requirement brief' },
  { value: 'business_requirements_document', label: 'Business requirements (BRD)' },
  { value: 'software_requirements_specification', label: 'Software requirements (SRS)' },
  { value: 'decision_log', label: 'Decision log' },
  { value: 'assumption_log', label: 'Assumption log' },
  { value: 'risk_log', label: 'Risk log' },
  { value: 'change_impact_note', label: 'Change impact note' },
  { value: 'traceability_report', label: 'Traceability report' },
  { value: 'handoff_document', label: 'Handoff document' },
  { value: 'uploaded_reference', label: 'Uploaded reference' },
  { value: 'generated_draft', label: 'Generated draft' },
  { value: 'summary', label: 'Summary' },
  { value: 'research', label: 'Research' },
  { value: 'note', label: 'Note' },
  { value: 'decision', label: 'Decision' },
  { value: 'project_doc', label: 'Project doc' },
  { value: 'other', label: 'Other' },
]

export const DOCUMENT_WORKFLOW_STATUS_OPTIONS: { value: DocumentWorkflowStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'approved', label: 'Approved' },
]

export const DOCUMENT_VISIBILITY_OPTIONS: { value: DocumentVisibility; label: string }[] = [
  { value: 'project', label: 'Project' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
]

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  note: 'Note',
  meeting_note: 'Meeting note',
  decision: 'Decision',
  research: 'Research',
  summary: 'Summary',
  project_doc: 'Project doc',
  project_brief: 'Project brief',
  elicitation_summary: 'Elicitation summary',
  requirement_brief: 'Requirement brief',
  business_requirements_document: 'Business requirements (BRD)',
  software_requirements_specification: 'Software requirements (SRS)',
  decision_log: 'Decision log',
  assumption_log: 'Assumption log',
  risk_log: 'Risk log',
  change_impact_note: 'Change impact note',
  traceability_report: 'Traceability report',
  handoff_document: 'Handoff document',
  uploaded_reference: 'Uploaded reference',
  generated_draft: 'Generated draft',
  other: 'Other',
}

export const DOCUMENT_WORKFLOW_STATUS_LABEL: Record<DocumentWorkflowStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  approved: 'Approved',
}

export function extractPlainTextFromContent(content: unknown): string {
  if (content && typeof content === 'object' && !Array.isArray(content)) {
    const obj = content as { format?: string; body?: string; value?: unknown[] }
    if (obj.format === 'plate' && Array.isArray(obj.value)) {
      const parts: string[] = []
      const walk = (nodes: unknown[]) => {
        for (const node of nodes) {
          if (!node || typeof node !== 'object') continue
          const n = node as { text?: string; children?: unknown[] }
          if (typeof n.text === 'string') parts.push(n.text)
          if (Array.isArray(n.children)) walk(n.children)
        }
      }
      walk(obj.value)
      return parts.join('\n').trim()
    }
    if (typeof obj.body === 'string') return obj.body.trim()
  }
  if (typeof content === 'string') return content.trim()
  return ''
}

export function emptyPlainContent(): PlainDocumentContent {
  return { format: 'plain', body: '' }
}

export function snippet(text: string, max = 160): string {
  const t = text.trim()
  if (!t) return ''
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

export const WORKFLOW_TRANSITIONS: Record<DocumentWorkflowStatus, DocumentWorkflowStatus[]> = {
  draft: ['in_review'],
  in_review: ['approved', 'draft'],
  approved: ['draft'],
}
