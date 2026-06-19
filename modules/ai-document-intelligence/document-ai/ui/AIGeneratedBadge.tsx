import { Badge } from '@/shared/ui'
import type { DocumentOriginType } from '@/modules/documents/document'
import type { AIGeneratedBadgeProps } from '../model/ai-document-intelligence'

const ORIGIN_LABELS: Partial<Record<DocumentOriginType, string>> = {
  ai_generated: 'AI generated',
  project_summary: 'Project brief',
  document_summary: 'Document summary',
  qa_session: 'From QA session',
  clarity_assessment: 'From clarity assessment',
  readiness_summary: 'From readiness report',
  template_generated: 'From template (AI)',
  from_template: 'From template',
}

export function AIGeneratedBadge({ generatedByAI, originType }: AIGeneratedBadgeProps) {
  if (!generatedByAI && originType !== 'project_summary' && originType !== 'document_summary') {
    return null
  }

  const label = (originType && ORIGIN_LABELS[originType]) || 'AI generated'

  return (
    <Badge variant="soft" tone="primary" size="sm">
      {label}
    </Badge>
  )
}

export function originLabel(originType: DocumentOriginType): string {
  return ORIGIN_LABELS[originType] ?? originType.replace(/_/g, ' ')
}
