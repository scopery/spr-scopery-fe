'use client'

import { Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { ArchitectureCatalogNode } from '../model/architecture-workbench'

interface BulkSourceTrayProps {
  sources: ArchitectureCatalogNode[]
  onRemove: (id: string) => void
  onClear: () => void
  onAddFromSelection: () => void
  selectionCount: number
}

export function BulkSourceTray({
  sources,
  onRemove,
  onClear,
  onAddFromSelection,
  selectionCount,
}: BulkSourceTrayProps) {
  const visible = sources.slice(0, 8)
  const extra = sources.length - visible.length

  return (
    <div className="border border-dashed border-secondary/40 bg-secondary/[0.03] px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography weight="medium" size="sm">
          Bulk sources
          <span className="ml-2 font-normal text-neutral-500">
            {sources.length} selected
          </span>
        </Typography>
        <div className="flex flex-wrap gap-1">
          {selectionCount > 0 ? (
            <Button size="sm" variant="ghost" onClick={onAddFromSelection}>
              Add {selectionCount} from selection
            </Button>
          ) : null}
          {sources.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {sources.length === 0 ? (
        <Typography variant="small" tone="muted" className="mt-1.5">
          Select nodes in the palette, then Add — or drag a bundle onto a drop lane with
          focus as the single source.
        </Typography>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {visible.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onRemove(n.id)}
              title="Remove from bulk sources"
              className={cn(
                'max-w-[10rem] truncate bg-white px-2 py-1 text-xs text-neutral-800',
                'border border-neutral-200 hover:border-neutral-400'
              )}
            >
              {n.name} ×
            </button>
          ))}
          {extra > 0 ? (
            <span className="px-2 py-1 text-xs text-neutral-500">+{extra} more</span>
          ) : null}
        </div>
      )}
    </div>
  )
}
