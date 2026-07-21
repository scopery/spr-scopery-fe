'use client'

import { Plus } from 'lucide-react'
import { Typography } from '@/shared/ui'
import type { AiChatSource } from './AiContextPicker'

interface AiWorkspaceContextStripProps {
  sources: AiChatSource[]
  onAdd?: () => void
  onOpenSources?: () => void
}

export function AiWorkspaceContextStrip({
  sources,
  onAdd,
  onOpenSources,
}: AiWorkspaceContextStripProps) {
  if (sources.length === 0) {
    return (
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 md:px-4">
        <Typography variant="small" tone="muted" className="truncate">
          No sources attached
        </Typography>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus size={12} />
            Add
          </button>
        ) : null}
      </div>
    )
  }

  const preview = sources
    .slice(0, 3)
    .map((s) => s.label)
    .join(', ')
  const extra = sources.length > 3 ? ` +${sources.length - 3}` : ''

  return (
    <button
      type="button"
      onClick={onOpenSources ?? onAdd}
      className="flex h-9 w-full shrink-0 items-center gap-2 border-b border-neutral-200 bg-neutral-50 px-3 text-left hover:bg-neutral-100 md:px-4"
    >
      <Typography variant="small" tone="muted" className="min-w-0 flex-1 truncate">
        {sources.length} source{sources.length === 1 ? '' : 's'}: {preview}
        {extra}
      </Typography>
      <span className="shrink-0 text-xs text-primary">Edit</span>
    </button>
  )
}
