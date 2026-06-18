'use client'

import { Badge } from '@/shared/ui'
import { DOCUMENT_TYPE_LABEL, type DocumentType } from '@/types/document'

const TONE_MAP: Partial<Record<DocumentType, 'neutral' | 'info' | 'primary' | 'success' | 'warning'>> = {
  note: 'neutral',
  meeting_note: 'info',
  decision: 'warning',
  research: 'primary',
  summary: 'success',
  project_doc: 'info',
  project_brief: 'primary',
  elicitation_summary: 'info',
  requirement_brief: 'primary',
  handoff_document: 'success',
  generated_draft: 'neutral',
  other: 'neutral',
}

interface DocumentTypeBadgeProps {
  type: DocumentType
  size?: 'sm' | 'md'
}

export function DocumentTypeBadge({ type, size = 'sm' }: DocumentTypeBadgeProps) {
  return (
    <Badge variant="soft" tone={TONE_MAP[type] ?? 'neutral'} size={size}>
      {DOCUMENT_TYPE_LABEL[type]}
    </Badge>
  )
}
