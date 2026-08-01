/**
 * FE-only icon grouping for Document Hub (and similar lists).
 * The catalog still shows every DocumentType; icons collapse into a few visual families.
 */

import type { DocumentType } from './document'

/** Visual icon family — not a BE enum. */
export const DocumentIconGroup = {
  Notes: 'notes',
  Requirements: 'requirements',
  Governance: 'governance',
  Reports: 'reports',
  Assets: 'assets',
  Other: 'other',
} as const
export type DocumentIconGroup = (typeof DocumentIconGroup)[keyof typeof DocumentIconGroup]

export interface DocumentFileIconSpec {
  group: DocumentIconGroup
  /** Public asset path under /icons */
  src: string
  /** Optional Tailwind class when a dedicated asset needs sizing/tint */
  className?: string
  /** Short label for title/tooltip (group name, not raw type) */
  label: string
}

/** Fallback when a group has no dedicated asset yet. */
export const DEFAULT_DOCUMENT_FILE_ICON = '/icons/other-icon.png'

/**
 * Map every DocumentType → icon group.
 * Unknown / future types fall through to Other via getDocumentIconGroup().
 */
const TYPE_TO_GROUP: Record<DocumentType, DocumentIconGroup> = {
  note: DocumentIconGroup.Notes,
  meeting_note: DocumentIconGroup.Notes,
  summary: DocumentIconGroup.Notes,
  elicitation_summary: DocumentIconGroup.Notes,

  project_brief: DocumentIconGroup.Requirements,
  requirement_brief: DocumentIconGroup.Requirements,
  business_requirements_document: DocumentIconGroup.Requirements,
  software_requirements_specification: DocumentIconGroup.Requirements,

  decision: DocumentIconGroup.Governance,
  decision_log: DocumentIconGroup.Governance,
  assumption_log: DocumentIconGroup.Governance,
  risk_log: DocumentIconGroup.Governance,
  change_impact_note: DocumentIconGroup.Governance,

  research: DocumentIconGroup.Reports,
  project_doc: DocumentIconGroup.Reports,
  traceability_report: DocumentIconGroup.Reports,
  handoff_document: DocumentIconGroup.Reports,

  uploaded_reference: DocumentIconGroup.Assets,
  generated_draft: DocumentIconGroup.Assets,

  other: DocumentIconGroup.Other,
}

/** Per-group icons from `public/icons/`. Assets reuses Other until a dedicated file exists. */
const GROUP_ICON: Record<DocumentIconGroup, Omit<DocumentFileIconSpec, 'group'>> = {
  [DocumentIconGroup.Notes]: {
    src: '/icons/notes-icon.png',
    label: 'Notes',
  },
  [DocumentIconGroup.Requirements]: {
    src: '/icons/reqs-icons.png',
    label: 'Requirements',
  },
  [DocumentIconGroup.Governance]: {
    src: '/icons/control-icon.png',
    label: 'Control',
  },
  [DocumentIconGroup.Reports]: {
    src: '/icons/report-icon.png',
    label: 'Reports',
  },
  [DocumentIconGroup.Assets]: {
    src: DEFAULT_DOCUMENT_FILE_ICON,
    label: 'Assets',
  },
  [DocumentIconGroup.Other]: {
    src: DEFAULT_DOCUMENT_FILE_ICON,
    label: 'Document',
  },
}

export function getDocumentIconGroup(documentType: string | null | undefined): DocumentIconGroup {
  if (!documentType) return DocumentIconGroup.Other
  return TYPE_TO_GROUP[documentType as DocumentType] ?? DocumentIconGroup.Other
}

export function getDocumentFileIcon(
  documentType: string | null | undefined
): DocumentFileIconSpec {
  const group = getDocumentIconGroup(documentType)
  const base = GROUP_ICON[group]
  return { group, ...base }
}

/** Types that render under a given icon group (for docs / future legend). */
export function listDocumentTypesInIconGroup(group: DocumentIconGroup): DocumentType[] {
  return (Object.keys(TYPE_TO_GROUP) as DocumentType[]).filter(
    (type) => TYPE_TO_GROUP[type] === group
  )
}
