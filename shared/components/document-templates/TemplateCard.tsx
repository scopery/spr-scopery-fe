'use client'

import { Typography } from '@/shared/ui'
import { DocumentTypeBadge } from '@/shared/components/documents/DocumentTypeBadge'
import { TemplateCategoryBadge } from './TemplateCategoryBadge'
import { TemplateScopeBadge } from './TemplateScopeBadge'
import { templateSnippet, type DocumentTemplate } from '@/types/document-template'
import { cn } from '@/utils'

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
        'w-full text-left border rounded-lg p-4 transition-colors',
        'hover:border-primary/40 hover:bg-neutral-50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-neutral-200 bg-white'
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
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
