'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Checkbox, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { Requirement } from '../model/requirements'
import {
  flattenSpecPackRequirements,
  type SpecPackGroup,
} from '../model/spec-pack'
import { toRequirementRef } from './SpecPackGroupOutline'

interface SpecPackAddRequirementsModalProps {
  open: boolean
  onClose: () => void
  groups: SpecPackGroup[]
  requirements: Requirement[]
  defaultGroupId?: string | null
  onAdd: (nextGroups: SpecPackGroup[]) => void
}

export function SpecPackAddRequirementsModal({
  open,
  onClose,
  groups,
  requirements,
  defaultGroupId,
  onAdd,
}: SpecPackAddRequirementsModalProps) {
  const [query, setQuery] = useState('')
  const [groupId, setGroupId] = useState<string>('')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const inPackIds = useMemo(
    () => new Set(flattenSpecPackRequirements(groups).map((r) => r.id)),
    [groups]
  )

  const available = useMemo(
    () => requirements.filter((r) => !inPackIds.has(r.id)),
    [requirements, inPackIds]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return available
    return available.filter((r) =>
      `${r.code} ${r.title}`.toLowerCase().includes(q)
    )
  }, [available, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setPicked(new Set())
    const preferred =
      (defaultGroupId && groups.some((g) => g.id === defaultGroupId)
        ? defaultGroupId
        : null) ??
      groups[0]?.id ??
      ''
    setGroupId(preferred)
  }, [open, groups, defaultGroupId])

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = () => {
    if (!groupId || picked.size === 0) return
    const byId = new Map(requirements.map((r) => [r.id, r]))
    const additions = [...picked]
      .map((id) => byId.get(id))
      .filter((r): r is Requirement => Boolean(r))
      .map(toRequirementRef)

    onAdd(
      groups.map((g) =>
        g.id === groupId
          ? { ...g, requirements: [...g.requirements, ...additions] }
          : g
      )
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add requirements"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline' },
        {
          label: `Add${picked.size ? ` (${picked.size})` : ''}`,
          onClick: handleAdd,
          disabled: picked.size === 0 || !groupId,
        },
      ]}
    >
      <div className="space-y-3">
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Target group
          </Typography>
          <select
            className="w-full border border-neutral-200 bg-white px-2 py-1.5 text-sm"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            {groups.map((g, i) => (
              <option key={g.id} value={g.id}>
                {i + 1}. {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
          <Search size={14} className="text-neutral-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requirements…"
          />
        </div>

        {available.length === 0 ? (
          <Typography variant="small" tone="muted">
            All project requirements are already in this pack.
          </Typography>
        ) : (
          <ul className="max-h-[min(50vh,360px)] overflow-y-auto border border-neutral-200">
            {filtered.map((r) => {
              const checked = picked.has(r.id)
              return (
                <li key={r.id} className="border-b border-neutral-100 last:border-b-0">
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2 px-3 py-2',
                      checked ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                    )}
                  >
                    <Checkbox
                      size="sm"
                      checked={checked}
                      onChange={() => toggle(r.id)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-neutral-900">
                        {r.code}
                      </span>
                      <span className="line-clamp-2 text-xs text-neutral-500">
                        {r.title}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center">
                <Typography variant="small" tone="muted">
                  No matches.
                </Typography>
              </li>
            ) : null}
          </ul>
        )}

        {picked.size > 0 ? (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setPicked(new Set())}>
              Clear selection
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
