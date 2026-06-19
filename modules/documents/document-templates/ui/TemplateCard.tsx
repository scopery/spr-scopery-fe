'use client'

import { Typography } from '@/shared/ui'
import { DocumentTypeBadge } from '@/modules/documents/document/ui/DocumentTypeBadge'
import { TemplateCategoryBadge } from './TemplateCategoryBadge'
import { TemplateScopeBadge } from './TemplateScopeBadge'
import { templateSnippet, type DocumentTemplate } from '@/modules/documents/document-templates'
import { cn } from '@/utils/cn'

interface TemplateCardProps {
  template: DocumentTemplate
  selected?: boolean
  onSelect: (template: DocumentTemplate) => void
}

export function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      aria-pressed={selected}
      aria-label={`Select template: ${template.title}`}
      className={cn(
        'w-full rounded-lg border p-4 text-left transition-colors',
        'hover:border-primary/40 hover:bg-neutral-50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected
          ? 'bg-primary/5 ring-primary/30 border-primary ring-1'
          : 'border-neutral-200 bg-white'
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Typography variant="small" weight="semibold">
          {template.title}
        </Typography>
        <TemplateScopeBadge scope={template.scope} />
        <DocumentTypeBadge type={template.document_type} />
        <TemplateCategoryBadge category={template.category} />
      </div>
      {template.description && (
        <Typography variant="small" tone="muted" className="mb-2 line-clamp-2">
          {template.description}
        </Typography>
      )}
      <Typography variant="small" tone="muted" className="line-clamp-2">
        {templateSnippet(template.plain_text)}
      </Typography>
    </button>
  )
}
