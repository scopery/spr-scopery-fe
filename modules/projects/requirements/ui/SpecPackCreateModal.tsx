'use client'

import { useMemo, useState } from 'react'
import { Button, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { Requirement } from '../model/requirements'
import { defaultSpecPackTitle, type SpecPackRequirementRef } from '../model/spec-pack'

interface SpecPackCreateModalProps {
  open: boolean
  onClose: () => void
  requirements: Requirement[]
  onCreate: (input: {
    title: string
    note?: string | null
    requirements: SpecPackRequirementRef[]
  }) => void
}

function reqType(r: Requirement): string | null {
  return r.req_type ?? r.type ?? null
}

export function SpecPackCreateModal({
  open,
  onClose,
  requirements,
  onCreate,
}: SpecPackCreateModalProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return requirements
    return requirements.filter((r) =>
      `${r.code} ${r.title} ${reqType(r) ?? ''}`.toLowerCase().includes(q)
    )
  }, [requirements, query])

  const selectedCount = selected.size
  const resolvedTitle =
    title.trim() || defaultSpecPackTitle(selectedCount || 1)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of filtered) next.add(r.id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const handleCreate = () => {
    if (selectedCount === 0) return
    const refs: SpecPackRequirementRef[] = requirements
      .filter((r) => selected.has(r.id))
      .map((r) => ({
        id: r.id,
        code: r.code,
        title: r.title,
        requirementType: reqType(r),
      }))
    onCreate({
      title: resolvedTitle,
      note: note.trim() || null,
      requirements: refs,
    })
    setQuery('')
    setSelected(new Set())
    setTitle('')
    setNote('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Spec Pack"
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline' },
        {
          label: `Create pack${selectedCount ? ` (${selectedCount})` : ''}`,
          onClick: handleCreate,
          disabled: selectedCount === 0,
        },
      ]}
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Pack title
            </Typography>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultSpecPackTitle(selectedCount || 1)}
              fullWidth
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Note (optional)
            </Typography>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Handoff scope, audience…"
              fullWidth
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter requirements…"
            className="max-w-sm"
            fullWidth
          />
          <div className="flex gap-2">
            <Button size="sm" variant="neutral-flat" onClick={selectAllFiltered}>
              Select filtered
            </Button>
            <Button size="sm" variant="neutral-flat" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto border border-neutral-200">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Typography tone="muted">No requirements match.</Typography>
            </div>
          ) : (
            <ul>
              {filtered.map((r) => {
                const checked = selected.has(r.id)
                return (
                  <li key={r.id} className="border-b border-neutral-100 last:border-b-0">
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 px-3 py-2.5',
                        checked ? 'bg-neutral-50' : 'hover:bg-neutral-50/80'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={checked}
                        onChange={() => toggle(r.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-neutral-900">
                          {r.code} · {r.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {reqType(r) || 'Requirement'}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
