import type { DocumentType } from './document'
import { DOCUMENT_TYPE_LABEL } from './document'

/**
 * Map FE DocumentType ↔ BE knowledge catalog codes (e.g. BRD, SRS).
 * Create/list may store either form; normalize both ways.
 */
const FE_TO_BE_CODE: Partial<Record<DocumentType, string>> = {
  business_requirements_document: 'BRD',
  software_requirements_specification: 'SRS',
  meeting_note: 'MEETING_NOTE',
  decision_log: 'DECISION_LOG',
  risk_log: 'RISK_REGISTER',
  uploaded_reference: 'REFERENCE',
  project_brief: 'PROJECT_PROPOSAL',
  change_impact_note: 'CHANGE_REQUEST',
  note: 'ARTICLE',
  research: 'ARTICLE',
  summary: 'REPORT',
  project_doc: 'SPECIFICATION',
  requirement_brief: 'SPECIFICATION',
  elicitation_summary: 'MEETING_NOTE',
  assumption_log: 'DECISION_LOG',
  traceability_report: 'REPORT',
  handoff_document: 'GUIDE',
  generated_draft: 'ARTICLE',
  decision: 'DECISION_LOG',
  other: 'ARTICLE',
}

const BE_TO_FE_TYPE: Record<string, DocumentType> = {
  BRD: 'business_requirements_document',
  SRS: 'software_requirements_specification',
  MEETING_NOTE: 'meeting_note',
  MEETING_MINUTES: 'meeting_note',
  DECISION_LOG: 'decision_log',
  RISK_REGISTER: 'risk_log',
  REFERENCE: 'uploaded_reference',
  PROJECT_PROPOSAL: 'project_brief',
  CHANGE_REQUEST: 'change_impact_note',
  ARTICLE: 'note',
  GUIDE: 'handoff_document',
  REPORT: 'summary',
  SPECIFICATION: 'project_doc',
  TECHNICAL_SPEC: 'project_doc',
  TEMPLATE: 'other',
  POLICY: 'other',
  USER_GUIDE: 'handoff_document',
  CONTRACT: 'other',
  TEST_PLAN: 'other',
  RELEASE_NOTE: 'summary',
  RETROSPECTIVE_NOTE: 'meeting_note',
}

/** Payload value for POST documentTypeCode. */
export function toBeDocumentTypeCode(type: DocumentType): string {
  return FE_TO_BE_CODE[type] ?? type.toUpperCase()
}

/** Normalize BE/FE code from list/get into FE DocumentType. */
export function fromBeDocumentTypeCode(
  code: string | null | undefined
): DocumentType {
  if (!code?.trim()) return 'other'
  const raw = code.trim()
  const upper = raw.toUpperCase()
  if (BE_TO_FE_TYPE[upper]) return BE_TO_FE_TYPE[upper]
  if (raw in DOCUMENT_TYPE_LABEL) return raw as DocumentType
  const lower = raw.toLowerCase()
  if (lower in DOCUMENT_TYPE_LABEL) return lower as DocumentType
  return 'other'
}
