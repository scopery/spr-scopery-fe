'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { AnchoredMenu, Button, Checkbox, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  RESOURCE_TIMELINE_DEFAULT_PROJECTS,
  defaultSelectedProjectIds,
} from '../../domain/rules/resource-timeline.rules'

export interface ProjectMultiSelectOption {
  id: string
  name: string
  code?: string
}

interface ProjectMultiSelectProps {
  options: ProjectMultiSelectOption[]
  value: string[]
  onChange: (ids: string[]) => void
  max: number
  className?: string
  disabled?: boolean
}

export function ProjectMultiSelect({
  options,
  value,
  onChange,
  max,
  className,
  disabled,
}: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const anchorRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => new Set(value), [value])
  const atCap = selected.size >= max

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.code ?? '').toLowerCase().includes(q)
    )
  }, [options, query])

  const toggle = (id: string) => {
    if (selected.has(id)) {
      onChange(value.filter((x) => x !== id))
      return
    }
    if (atCap) return
    onChange([...value, id])
  }

  const selectNewestDefault = () => {
    onChange(defaultSelectedProjectIds(options, RESOURCE_TIMELINE_DEFAULT_PROJECTS))
  }

  const clearAll = () => onChange([])

  return (
    <div ref={anchorRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        size="md"
        className="h-9 w-full justify-between gap-2 px-3"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate text-sm">
          Projects ({value.length}
          {max ? `/${max}` : ''})
        </span>
        <ChevronDown size={14} className="shrink-0 text-neutral-500" />
      </Button>
      <AnchoredMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        minWidth={300}
      >
        <div className="space-y-2 border-b border-neutral-100 px-3 py-2">
          <Input
            fullWidth
            size="sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            prefix={<Search size={14} />}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs text-neutral-600 underline hover:text-neutral-900"
              onClick={selectNewestDefault}
            >
              Select newest {RESOURCE_TIMELINE_DEFAULT_PROJECTS}
            </button>
            <button
              type="button"
              className="text-xs text-neutral-600 underline hover:text-neutral-900"
              onClick={clearAll}
            >
              Clear
            </button>
          </div>
          {atCap ? (
            <Typography variant="caption" tone="muted">
              Max {max} projects (fan-out cap).
            </Typography>
          ) : null}
        </div>
        <ul className="max-h-64 overflow-y-auto py-1" role="listbox" aria-multiselectable>
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500">No active projects.</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500">No projects match.</li>
          ) : (
            filtered.map((opt) => {
              const checked = selected.has(opt.id)
              const disableAdd = !checked && atCap
              return (
                <li key={opt.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 px-3 py-2 text-sm hover:bg-neutral-50',
                      disableAdd && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Checkbox
                      size="sm"
                      checked={checked}
                      disabled={disableAdd}
                      onChange={() => toggle(opt.id)}
                      aria-label={opt.name}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-neutral-900">{opt.name}</span>
                      {opt.code ? (
                        <span className="block truncate text-xs text-neutral-500">
                          {opt.code}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              )
            })
          )}
        </ul>
      </AnchoredMenu>
    </div>
  )
}
