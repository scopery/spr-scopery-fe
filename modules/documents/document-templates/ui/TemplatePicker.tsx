'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input, Typography, ContentLoader } from '@/shared/ui'
import * as documentTemplatesApi from '../api/document-templates.api'
import type { DocumentTemplate } from '../model/document-templates'
import { TemplateCard } from './TemplateCard'

export interface TemplatePickerProps {
  orgId: string
  selectedId?: string | null
  onSelect: (template: DocumentTemplate | null) => void
}

export function TemplatePicker({ orgId, selectedId, onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await documentTemplatesApi.listAvailableTemplates(orgId, { limit: 50 })
      setTemplates(result.items)
    } catch {
      setError('Failed to load templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false) ||
        t.plain_text.toLowerCase().includes(q)
    )
  }, [templates, search])

  const systemTemplates = filtered.filter((t) => t.scope === 'system')
  const personalTemplates = filtered.filter((t) => t.scope === 'personal')

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <ContentLoader variant="easeOut" className="w-16" />
      </div>
    )
  }

  if (error) {
    return (
      <Typography tone="error" variant="small">
        {error}
      </Typography>
    )
  }

  if (templates.length === 0) {
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
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or content…"
        fullWidth
      />

      {filtered.length === 0 ? (
        <Typography variant="small" tone="muted">
          No templates match your search.
        </Typography>
      ) : (
        <div className="max-h-[360px] space-y-4 overflow-y-auto pr-1">
          {systemTemplates.length > 0 && (
            <section aria-label="System templates">
              <Typography variant="small" weight="medium" className="mb-2 block">
                System templates
              </Typography>
              <div className="space-y-2">
                {systemTemplates.map((template) => (
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

          {personalTemplates.length > 0 && (
            <section aria-label="My templates">
              <Typography variant="small" weight="medium" className="mb-2 block">
                My templates
              </Typography>
              <div className="space-y-2">
                {personalTemplates.map((template) => (
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
