'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Badge, Button, Checkbox, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { getRequirement } from '../api/requirements.api'
import type { Requirement } from '../model/requirements'
import {
  requirementPriorityBadgeProps,
  requirementPriorityLabel,
} from '../model/requirement-priority'
import {
  defaultSpecPackGroup,
  defaultSpecPackTitle,
  flattenSpecPackRequirements,
  type CreateSpecPackInput,
  type SpecPackGroup,
} from '../model/spec-pack'
import { SpecPackGroupOutline, toRequirementRef } from './SpecPackGroupOutline'

interface SpecPackCreateModalProps {
  open: boolean
  onClose: () => void
  requirements: Requirement[]
  onCreate: (input: CreateSpecPackInput) => void
}

function reqTypeLabel(r: Requirement): string {
  const raw = (r.requirementType ?? r.type ?? r.req_type ?? '').toString().toUpperCase()
  switch (raw) {
    case 'FR':
    case 'FUNCTIONAL':
      return 'Functional'
    case 'NFR':
    case 'NON_FUNCTIONAL':
      return 'Non-functional'
    case 'BO':
    case 'BUSINESS':
      return 'Business'
    case 'BR':
      return 'Business rule'
    case 'TECHNICAL':
      return 'Technical'
    case 'CONSTRAINT':
      return 'Constraint'
    default:
      return raw || 'Requirement'
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PreviewField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <div className="mt-0.5 text-sm text-neutral-900">{value}</div>
    </div>
  )
}

export function SpecPackCreateModal({
  open,
  onClose,
  requirements,
  onCreate,
}: SpecPackCreateModalProps) {
  const params = useParams()
  const projectId = params.projectId as string
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SpecPackGroup[]>(() => [defaultSpecPackGroup()])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [enriched, setEnriched] = useState<Record<string, Partial<Requirement>>>({})

  useEffect(() => {
    if (!open) return
    const initial = defaultSpecPackGroup()
    setQuery('')
    setGroups([initial])
    setActiveGroupId(initial.id)
    setFocusedId(null)
    setTitle('')
    setNote('')
    setEnriched({})
  }, [open])

  const items = useMemo(
    () =>
      requirements.map((r) => {
        const patch = enriched[r.id]
        return patch ? { ...r, ...patch } : r
      }),
    [requirements, enriched]
  )

  const byId = useMemo(() => new Map(items.map((r) => [r.id, r])), [items])

  const selectedIds = useMemo(
    () => flattenSpecPackRequirements(groups).map((r) => r.id),
    [groups]
  )
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const selectedCount = selectedIds.length

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) =>
      `${r.code} ${r.title} ${reqTypeLabel(r)} ${r.description ?? ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [items, query])

  useEffect(() => {
    if (!open || filtered.length === 0) {
      if (focusedId && !byId.has(focusedId)) setFocusedId(null)
      return
    }
    if (focusedId && filtered.some((r) => r.id === focusedId)) return
    setFocusedId(filtered[0].id)
  }, [open, filtered, focusedId, byId])

  useEffect(() => {
    if (!activeGroupId || !groups.some((g) => g.id === activeGroupId)) {
      setActiveGroupId(groups[0]?.id ?? null)
    }
  }, [groups, activeGroupId])

  const focused = focusedId ? byId.get(focusedId) ?? null : null
  const focusedSelected = focused ? selectedSet.has(focused.id) : false
  const resolvedTitle = title.trim() || defaultSpecPackTitle(selectedCount || 1)
  const focusedDescription = focused?.description ?? null
  const focusedPriority = focused?.priority ?? null
  const targetGroupId = activeGroupId ?? groups[0]?.id ?? null

  useEffect(() => {
    if (!open || !focusedId || !projectId || focusedDescription?.trim()) return
    let cancelled = false
    void getRequirement('', projectId, focusedId)
      .then((full) => {
        if (cancelled || !full.description?.trim()) return
        setEnriched((prev) => ({
          ...prev,
          [focusedId]: {
            description: full.description,
            priority: focusedPriority ?? full.priority,
          },
        }))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [open, focusedId, projectId, focusedDescription, focusedPriority])

  const addToActiveGroup = (id: string) => {
    const req = byId.get(id)
    if (!req || !targetGroupId || selectedSet.has(id)) return
    const ref = toRequirementRef(req)
    setGroups((prev) =>
      prev.map((g) =>
        g.id === targetGroupId ? { ...g, requirements: [...g.requirements, ref] } : g
      )
    )
  }

  const removeFromGroups = (id: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        requirements: g.requirements.filter((r) => r.id !== id),
      }))
    )
  }

  const toggle = (id: string) => {
    if (selectedSet.has(id)) removeFromGroups(id)
    else addToActiveGroup(id)
  }

  const selectAllFiltered = () => {
    if (!targetGroupId) return
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== targetGroupId) return g
        const existing = new Set(g.requirements.map((r) => r.id))
        const additions = filtered
          .filter((r) => !selectedSet.has(r.id) && !existing.has(r.id))
          .map(toRequirementRef)
        return { ...g, requirements: [...g.requirements, ...additions] }
      })
    )
  }

  const clearSelection = () => {
    setGroups((prev) => prev.map((g) => ({ ...g, requirements: [] })))
  }

  const handleCreate = () => {
    if (selectedCount === 0) return
    const cleaned = groups
      .map((g) => ({
        ...g,
        name: g.name.trim() || 'Untitled group',
        description: g.description?.trim() || null,
      }))
      .filter((g) => g.requirements.length > 0 || groups.length === 1)
    onCreate({
      title: resolvedTitle,
      note: note.trim() || null,
      groups: cleaned.length ? cleaned : [defaultSpecPackGroup()],
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Spec Pack"
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline' },
        {
          label: `Create pack${selectedCount ? ` (${selectedCount})` : ''}`,
          onClick: handleCreate,
          disabled: selectedCount === 0,
        },
      ]}
    >
      <div className="space-y-3">
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

        {requirements.length === 0 ? (
          <Typography variant="small" tone="muted">
            No requirements in this project yet.
          </Typography>
        ) : (
          <div className="grid grid-cols-1 gap-0 overflow-hidden border border-neutral-200 lg:h-[min(52vh,440px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_minmax(0,1.1fr)]">
            {/* Catalog */}
            <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:h-full lg:border-b-0 lg:border-r">
              <div className="shrink-0 space-y-2 border-b border-neutral-100 px-3 py-2.5">
                <Typography variant="small" weight="semibold">
                  Requirements
                </Typography>
                <div className="flex items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
                  <Search size={14} className="text-neutral-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                  />
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={selectAllFiltered}>
                    Add filtered to group
                  </Button>
                </div>
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {filtered.map((r) => {
                  const checked = selectedSet.has(r.id)
                  return (
                    <li key={r.id} className="border-b border-neutral-100 last:border-b-0">
                      <div
                        className={cn(
                          'flex items-start gap-2 px-3 py-2',
                          focusedId === r.id && 'bg-neutral-50'
                        )}
                      >
                        <Checkbox
                          size="sm"
                          checked={checked}
                          onChange={() => toggle(r.id)}
                          className="mt-0.5"
                        />
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setFocusedId(r.id)}
                        >
                          <span className="block text-sm font-medium text-neutral-900">
                            {r.code}
                          </span>
                          <span className="line-clamp-2 text-xs text-neutral-500">{r.title}</span>
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* Focus preview */}
            <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:h-full lg:border-b-0 lg:border-r">
              <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
                <Typography variant="small" weight="semibold">
                  Preview
                </Typography>
              </div>
              {!focused ? (
                <div className="flex flex-1 items-center justify-center px-4">
                  <Typography variant="small" tone="muted">
                    Select a requirement.
                  </Typography>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
                  <div>
                    <Typography weight="medium" size="sm">
                      {focused.code} · {focused.title}
                    </Typography>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge size="sm" variant="soft">
                        {reqTypeLabel(focused)}
                      </Badge>
                      {focused.priority ? (
                        <Badge
                          size="sm"
                          {...requirementPriorityBadgeProps(focused.priority)}
                        >
                          {requirementPriorityLabel(focused.priority)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <PreviewField
                    label="Description"
                    value={
                      focused.description?.trim() ? (
                        <span className="whitespace-pre-wrap">{focused.description}</span>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <PreviewField label="Updated" value={formatDate(focused.updated_at)} />
                  <Button
                    size="sm"
                    variant={focusedSelected ? 'outline' : 'primary'}
                    fullWidth
                    onClick={() => toggle(focused.id)}
                  >
                    {focusedSelected ? 'Remove from pack' : 'Add to active group'}
                  </Button>
                </div>
              )}
            </section>

            {/* Groups */}
            <section className="flex min-h-0 flex-col lg:h-full">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2.5">
                <div>
                  <Typography variant="small" weight="semibold">
                    Groups ({groups.length})
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    Name + description · drag order
                  </Typography>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  disabled={selectedCount === 0}
                >
                  Clear reqs
                </Button>
              </div>
              <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
                <Typography variant="caption" tone="muted" className="mb-1 block">
                  Active group (new adds go here)
                </Typography>
                <select
                  className="w-full border border-neutral-200 bg-white px-2 py-1.5 text-sm"
                  value={targetGroupId ?? ''}
                  onChange={(e) => setActiveGroupId(e.target.value)}
                >
                  {groups.map((g, i) => (
                    <option key={g.id} value={g.id}>
                      {i + 1}. {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <SpecPackGroupOutline
                className="min-h-0 max-h-[36vh] lg:max-h-none lg:flex-1"
                groups={groups}
                activeRequirementId={focusedId}
                onChange={setGroups}
                onSelectRequirement={setFocusedId}
                allowRemoveRequirement
                editableMeta
              />
            </section>
          </div>
        )}
      </div>
    </Modal>
  )
}
