'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Checkbox, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { ScopePackage } from '@/modules/projects/scope'
import type { Requirement } from '../model/requirements'
import {
  matchesRequirementScopeFilter,
  type RequirementScopeFilter,
} from '../model/requirement-scope.rules'
import {
  flattenSpecPackRequirements,
  type SpecPackGroup,
} from '../model/spec-pack'
import { toRequirementRef } from './SpecPackGroupOutline'
import { RequirementScopeFilterSelect } from './RequirementScopeFilterSelect'

interface SpecPackAddRequirementsModalProps {
  open: boolean
  onClose: () => void
  groups: SpecPackGroup[]
  requirements: Requirement[]
  scopePackages?: ScopePackage[]
  projectId: string
  defaultGroupId?: string | null
  onAdd: (nextGroups: SpecPackGroup[]) => void
}

export function SpecPackAddRequirementsModal({
  open,
  onClose,
  groups,
  requirements,
  scopePackages = [],
  projectId,
  defaultGroupId,
  onAdd,
}: SpecPackAddRequirementsModalProps) {
  const [query, setQuery] = useState('')
  const [scopeFilter, setScopeFilter] = useState<RequirementScopeFilter>('all')
  const [groupId, setGroupId] = useState<string>('')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  const inPackIds = useMemo(
    () => new Set(flattenSpecPackRequirements(groups).map((r) => r.id)),
    [groups]
  )

  const scopePackageById = useMemo(() => {
    const map = new Map<string, ScopePackage>()
    for (const p of scopePackages) map.set(p.id, p)
    return map
  }, [scopePackages])

  const available = useMemo(
    () => requirements.filter((r) => !inPackIds.has(r.id)),
    [requirements, inPackIds]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return available.filter((r) => {
      if (!matchesRequirementScopeFilter(r, scopeFilter)) return false
      if (!q) return true
      const scopeLabel = r.scopePackageId
        ? `${scopePackageById.get(r.scopePackageId)?.code ?? ''} ${
            scopePackageById.get(r.scopePackageId)?.name ?? ''
          }`
        : 'unscoped'
      return `${r.code} ${r.title} ${scopeLabel}`.toLowerCase().includes(q)
    })
  }, [available, query, scopeFilter, scopePackageById])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setScopeFilter('all')
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

        <RequirementScopeFilterSelect
          projectId={projectId}
          value={scopeFilter}
          onChange={setScopeFilter}
          packages={scopePackages}
          className="w-full"
        />

        <div className="flex items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
          <Search size={14} className="text-neutral-400" />
          <input
            className="w-full bg-transparent text-sm outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, title, scope…"
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
                      aria-label={`Select ${r.title}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-neutral-900">
                        {r.title}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {r.code}
                        {r.scopePackageId
                          ? ` · ${scopePackageById.get(r.scopePackageId)?.code ?? 'Scoped'}`
                          : ' · Unscoped'}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center">
                <Typography variant="small" tone="muted">
                  No requirements match this scope filter.
                </Typography>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </Modal>
  )
}
