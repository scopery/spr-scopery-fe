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
import { defaultSpecPackTitle, type SpecPackRequirementRef } from '../model/spec-pack'
import { SpecPackChapterOutline } from './SpecPackChapterOutline'

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
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [enriched, setEnriched] = useState<Record<string, Partial<Requirement>>>({})

  useEffect(() => {
    if (!open) return
    setQuery('')
    setSelectedIds([])
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
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

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

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => byId.get(id))
        .filter((r): r is Requirement => Boolean(r)),
    [selectedIds, byId]
  )

  const focused = focusedId ? byId.get(focusedId) ?? null : null
  const focusedSelected = focused ? selectedSet.has(focused.id) : false
  const selectedCount = selectedIds.length
  const resolvedTitle = title.trim() || defaultSpecPackTitle(selectedCount || 1)

  const focusedDescription = focused?.description ?? null
  const focusedPriority = focused?.priority ?? null

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

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      return [...prev, id]
    })
  }

  const removeSelected = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = [...prev]
      for (const r of filtered) {
        if (!next.includes(r.id)) next.push(r.id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedIds([])

  const handleCreate = () => {
    if (selectedCount === 0) return
    const refs: SpecPackRequirementRef[] = selectedIds
      .map((id) => byId.get(id))
      .filter((r): r is Requirement => Boolean(r))
      .map((r) => ({
        id: r.id,
        code: r.code,
        title: r.title,
        requirementType: r.requirementType ?? r.req_type ?? r.type ?? null,
      }))
    onCreate({
      title: resolvedTitle,
      note: note.trim() || null,
      requirements: refs,
    })
    setQuery('')
    setSelectedIds([])
    setFocusedId(null)
    setTitle('')
    setNote('')
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

        <Typography variant="small" tone="muted">
          Search on the left, preview details in the middle, then add requirements to the pack on
          the right.
        </Typography>

        {requirements.length === 0 ? (
          <Typography variant="small" tone="muted">
            No requirements in this project yet.
          </Typography>
        ) : (
          <div className="grid grid-cols-1 gap-0 overflow-hidden border border-neutral-200 lg:h-[min(48vh,400px)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_minmax(0,0.95fr)]">
            {/* Left: searchable catalog */}
            <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:h-full lg:border-b-0 lg:border-r">
              <div className="shrink-0 space-y-2 border-b border-neutral-100 px-3 py-2.5">
                <Typography variant="small" weight="semibold">
                  Requirements
                </Typography>
                <div className="flex items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
                  <Search size={14} className="shrink-0 text-neutral-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search code, title, type…"
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    aria-label="Search requirements"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="neutral-flat" onClick={selectAllFiltered}>
                    Select filtered
                  </Button>
                  <Typography variant="caption" tone="muted" className="self-center">
                    {filtered.length} shown
                  </Typography>
                </div>
              </div>
              <ul className="min-h-0 max-h-[36vh] overflow-y-auto lg:max-h-none lg:flex-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No requirements match.
                    </Typography>
                  </li>
                ) : (
                  filtered.map((r) => {
                    const checked = selectedSet.has(r.id)
                    const focusedRow = focusedId === r.id
                    return (
                      <li key={r.id} className="border-b border-neutral-100 last:border-b-0">
                        <div
                          className={cn(
                            'flex items-start gap-2 px-3 py-2 text-sm',
                            focusedRow && 'bg-neutral-100',
                            !focusedRow && 'hover:bg-neutral-50'
                          )}
                        >
                          <Checkbox
                            size="sm"
                            checked={checked}
                            onChange={() => {
                              setFocusedId(r.id)
                              toggle(r.id)
                            }}
                            aria-label={`Select ${r.title}`}
                          />
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => setFocusedId(r.id)}
                          >
                            <span className="block break-words font-medium text-neutral-900">
                              {r.title}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {r.code}
                              {` · ${reqTypeLabel(r)}`}
                            </span>
                          </button>
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            </section>

            {/* Middle: detail preview */}
            <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:h-full lg:border-b-0 lg:border-r">
              <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
                <Typography variant="small" weight="semibold">
                  Preview
                </Typography>
              </div>
              {!focused ? (
                <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    Select a requirement on the left to preview its details here.
                  </Typography>
                </div>
              ) : (
                <div className="min-h-0 max-h-[36vh] space-y-4 overflow-y-auto px-4 py-3 lg:max-h-none lg:flex-1">
                  <div>
                    <Typography variant="caption" tone="muted" className="font-mono">
                      {focused.code}
                    </Typography>
                    <Typography as="h3" weight="semibold" className="mt-0.5 break-words">
                      {focused.title}
                    </Typography>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant="soft" tone="neutral">
                        {reqTypeLabel(focused)}
                      </Badge>
                      {focused.priority
                        ? (() => {
                            const badge = requirementPriorityBadgeProps(focused.priority)
                            return (
                              <Badge
                                variant={badge.variant}
                                tone={badge.tone}
                                className={badge.className}
                              >
                                {requirementPriorityLabel(focused.priority)}
                              </Badge>
                            )
                          })()
                        : null}
                      {focusedSelected ? (
                        <Badge variant="soft" tone="success">
                          Selected
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <Typography variant="caption" tone="muted">
                      Description
                    </Typography>
                    <Typography
                      variant="small"
                      className="mt-1 whitespace-pre-wrap text-neutral-800"
                    >
                      {focused.description?.trim() || 'No description.'}
                    </Typography>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PreviewField
                      label="Priority"
                      value={requirementPriorityLabel(focused.priority)}
                    />
                    <PreviewField label="Type" value={reqTypeLabel(focused)} />
                    <PreviewField label="Created" value={formatDate(focused.created_at)} />
                    <PreviewField
                      label="Updated"
                      value={formatDate(focused.updated_at ?? focused.created_at)}
                    />
                    <PreviewField
                      label="Functional item"
                      value={focused.functionalItemId ? 'Linked' : '—'}
                    />
                    <PreviewField
                      label="Non-functional item"
                      value={focused.nonFunctionalItemId ? 'Linked' : '—'}
                    />
                  </div>

                  <div className="border-t border-neutral-100 pt-3">
                    {focusedSelected ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onClick={() => toggle(focused.id)}
                      >
                        Remove from pack
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        fullWidth
                        onClick={() => toggle(focused.id)}
                      >
                        Add to pack
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Right: selected queue (reading order) */}
            <section className="flex min-h-0 flex-col lg:h-full">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2.5">
                <div>
                  <Typography variant="small" weight="semibold">
                    In pack ({selectedItems.length})
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    Drag to set reading order
                  </Typography>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  disabled={selectedItems.length === 0}
                >
                  Clear
                </Button>
              </div>
              <SpecPackChapterOutline
                className="min-h-0 max-h-[36vh] lg:max-h-none lg:flex-1"
                items={selectedItems.map((r) => ({
                  id: r.id,
                  code: r.code,
                  title: r.title,
                }))}
                activeId={focusedId}
                onSelect={setFocusedId}
                onRemove={removeSelected}
                onReorder={setSelectedIds}
                emptyMessage="Preview a requirement, then add it here before creating the pack."
              />
            </section>
          </div>
        )}
      </div>
    </Modal>
  )
}
