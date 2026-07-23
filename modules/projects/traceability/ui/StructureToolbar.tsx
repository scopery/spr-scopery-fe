'use client'

import { useMemo, useState } from 'react'
import { Button, Input, Typography } from '@/shared/ui'
import type { OverallStructureResponse, StructureFocus } from '../model/overall-structure'
import {
  searchOverallStructure,
  type StructureSearchHit,
} from '../model/structure-tree-search'

interface StructureToolbarProps {
  tree: OverallStructureResponse | null
  onSearchSelect: (hit: StructureSearchHit) => void
  onCollapseAll: () => void
  onExpandOneLevel: () => void
  onExpandAll: () => void
  onRefresh: () => void
}

export function StructureToolbar({
  tree,
  onSearchSelect,
  onCollapseAll,
  onExpandOneLevel,
  onExpandAll,
  onRefresh,
}: StructureToolbarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const hits = useMemo(
    () => (tree ? searchOverallStructure(tree, query) : []),
    [tree, query]
  )

  return (
    <div className="shrink-0 space-y-2 border-b border-neutral-100 p-3">
      <div className="relative">
        <Input
          fullWidth
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search structure…"
          aria-label="Search structure"
        />
        {open && query.trim() && hits.length > 0 ? (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto border border-neutral-200 bg-white shadow-sm">
            {hits.map((hit) => (
              <li key={`${hit.focus.type}:${hit.focus.id}`}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-secondary/5"
                  onClick={() => {
                    onSearchSelect(hit)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500">
                    {hit.kind}
                  </div>
                  <div className="truncate text-sm text-neutral-900">{hit.label}</div>
                  <div className="truncate text-xs text-neutral-500">{hit.path}</div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && query.trim() && hits.length === 0 ? (
          <div className="absolute z-20 mt-1 w-full border border-neutral-200 bg-white px-3 py-2 shadow-sm">
            <Typography variant="small" tone="muted">
              No matches in loaded structure.
            </Typography>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="ghost" onClick={onCollapseAll}>
          Collapse all
        </Button>
        <Button size="sm" variant="ghost" onClick={onExpandOneLevel}>
          Expand one level
        </Button>
        <Button size="sm" variant="ghost" onClick={onExpandAll}>
          Expand all
        </Button>
        <Button size="sm" variant="ghost" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
    </div>
  )
}

export type { StructureFocus }
