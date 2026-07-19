'use client'

import { useMemo, useState } from 'react'
import { Braces, Copy, CornerDownLeft } from 'lucide-react'
import { Badge, Button, Input, Typography, Select } from '@/shared/ui'
import { formatVariableToken } from '../model/template-variables/extract-template-variables'
import type { TemplateVariableDefinition } from '@/modules/documents/document-templates'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

const CATEGORY_LABEL: Record<TemplateVariableDefinition['category'], string> = {
  project: 'Project',
  workspace: 'Workspace',
  document: 'Document',
  user: 'User',
  date: 'Date',
  session: 'Session',
  assessment: 'Assessment',
}

export interface TemplateVariablePanelProps {
  variables: TemplateVariableDefinition[]
  knownKeys?: Set<string>
  onInsert: (token: string) => void
  className?: string
}

export function TemplateVariablePanel({
  variables,
  knownKeys,
  onInsert,
  className,
}: TemplateVariablePanelProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const set = new Set(variables.map((v) => v.category))
    return ['all', ...Array.from(set).sort()]
  }, [variables])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return variables.filter((variable) => {
      if (category !== 'all' && variable.category !== category) return false
      if (!q) return true
      return (
        variable.key.includes(q) ||
        variable.label.toLowerCase().includes(q) ||
        variable.description.toLowerCase().includes(q)
      )
    })
  }, [variables, query, category])

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token)
      toast.success('Variable copied')
    } catch {
      toast.error('Could not copy variable')
    }
  }

  return (
    <aside
      className={cn('space-y-4 border border-neutral-200 bg-neutral-50 p-4', className)}
      aria-label="Template variables"
    >
      <div className="flex items-center gap-2">
        <Braces size={16} className="text-neutral-600" aria-hidden />
        <Typography weight="semibold" variant="small">
          Variables
        </Typography>
      </div>

      <Typography variant="small" tone="muted">
        Insert placeholders that resolve when creating a document from this template.
      </Typography>

      <Input
        label="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search variables…"
        fullWidth
      />

      <Select
        value={category}
        onValueChange={setCategory}
        options={categories.map((cat) => ({
          value: cat,
          label:
            cat === 'all'
              ? 'All categories'
              : (CATEGORY_LABEL[cat as TemplateVariableDefinition['category']] ?? cat),
        }))}
        placeholder="All categories"
      />

      <div className="max-h-[420px] space-y-3 overflow-y-auto">
        {filtered.length === 0 ? (
          <Typography variant="small" tone="muted">
            No variables match your search.
          </Typography>
        ) : (
          filtered.map((variable) => {
            const token = formatVariableToken(variable.key)
            const isUnknown = knownKeys ? !knownKeys.has(variable.key) && knownKeys.size > 0 : false
            return (
              <div key={variable.key} className="space-y-2 border border-neutral-200 bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Typography weight="medium" variant="small">
                      {variable.label}
                    </Typography>
                    <Typography variant="small" tone="muted" className="mt-0.5 font-mono">
                      {token}
                    </Typography>
                  </div>
                  <Badge tone="neutral">
                    {CATEGORY_LABEL[variable.category]}
                  </Badge>
                </div>
                <Typography variant="small" tone="muted">
                  {variable.description}
                </Typography>
                <Typography variant="small" tone="muted">
                  Example: {variable.example}
                </Typography>
                <div className="flex gap-2">
                  <Button type="button" variant="primary" onClick={() => onInsert(token)} icon={<CornerDownLeft size={16} />}>
                    Insert
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyToken(token)}
                    aria-label={`Copy ${token}`}
                  >
                    <Copy size={14} aria-hidden />
                  </Button>
                </div>
                {isUnknown && (
                  <Typography variant="small" tone="muted">
                    Requires context: {variable.requiredContext.join(', ') || 'none'}
                  </Typography>
                )}
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
