'use client'

import { Input, Typography, ContentLoader } from '@/shared/ui'
import type { DocumentTemplate } from '../model/document-templates'
import { TemplateCard } from './TemplateCard'
import { useTemplatePicker } from '../hooks/useTemplatePicker'

export interface TemplatePickerProps {
  orgId: string
  selectedId?: string | null
  onSelect: (template: DocumentTemplate | null) => void
}

export function TemplatePicker({ orgId, selectedId, onSelect }: TemplatePickerProps) {
  const picker = useTemplatePicker(orgId)

  if (picker.loading) {
    return (
      <div className="flex justify-center py-8">
        <ContentLoader variant="easeOut" className="w-16" />
      </div>
    )
  }

  if (picker.error) {
    return (
      <Typography tone="error" variant="small">
        {picker.error}
      </Typography>
    )
  }

  if (picker.templates.length === 0) {
    return (
      <Typography variant="small" tone="muted" className="py-4">
        No templates available. Run the document template seed on the backend, or create a personal
        template.
      </Typography>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        label="Search templates"
        value={picker.search}
        onChange={(e) => picker.setSearch(e.target.value)}
        placeholder="Search by title or content…"
        fullWidth
      />

      {picker.filtered.length === 0 ? (
        <Typography variant="small" tone="muted">
          No templates match your search.
        </Typography>
      ) : (
        <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
          {picker.systemTemplates.length > 0 && (
            <section aria-label="System templates">
              <Typography variant="small" weight="medium" className="mb-2 block">
                System templates
              </Typography>
              <div className="space-y-2">
                {picker.systemTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedId === template.id}
                    onSelect={(t) => onSelect(t)}
                  />
                ))}
              </div>
            </section>
          )}

          {picker.personalTemplates.length > 0 && (
            <section aria-label="My templates">
              <Typography variant="small" weight="medium" className="mb-2 block">
                My templates
              </Typography>
              <div className="space-y-2">
                {picker.personalTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    selected={selectedId === template.id}
                    onSelect={(t) => onSelect(t)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
