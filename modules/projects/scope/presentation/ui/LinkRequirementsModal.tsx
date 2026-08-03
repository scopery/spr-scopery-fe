'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Badge, Button, Checkbox, Modal, Typography } from '@/shared/ui'
import { listRequirements } from '@/modules/projects/requirements/api/requirements.api'
import type { Requirement } from '@/modules/projects/requirements/model/requirements'
import { cn } from '@/utils/cn'

interface LinkRequirementsModalProps {
  open: boolean
  projectId: string
  /** Already linked requirement ids — shown as linked, not selectable */
  linkedIds: Set<string>
  onClose: () => void
  onSubmit: (requirementIds: string[]) => Promise<void>
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

function reqPriorityLabel(priority: string | null | undefined): string {
  switch ((priority ?? '').toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
      return 'High'
    case 'MEDIUM':
      return 'Medium'
    case 'LOW':
      return 'Low'
    default:
      return priority?.trim() || '—'
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

export function LinkRequirementsModal({
  open,
  projectId,
  linkedIds,
  onClose,
  onSubmit,
}: LinkRequirementsModalProps) {
  const [all, setAll] = useState<Requirement[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelected(new Set())
    setFocusedId(null)
    setQuery('')
    setError(null)
    setLoading(true)
    void listRequirements('', projectId)
      .then((res) => setAll(res.items ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load requirements'))
      .finally(() => setLoading(false))
  }, [open, projectId])

  const byId = useMemo(() => new Map(all.map((r) => [r.id, r])), [all])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) => {
      const hay = `${r.code} ${r.title} ${reqTypeLabel(r)} ${r.description ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [all, query])

  // Keep focus on a visible row (or first filtered) when list/query changes.
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
      [...selected]
        .map((id) => byId.get(id))
        .filter((r): r is Requirement => Boolean(r)),
    [selected, byId]
  )

  const focused = focusedId ? byId.get(focusedId) ?? null : null
  const focusedAlreadyLinked = focused ? linkedIds.has(focused.id) : false
  const focusedSelected = focused ? selected.has(focused.id) : false

  const toggle = (id: string) => {
    if (linkedIds.has(id)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const removeSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const selectFilteredAvailable = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of filtered) {
        if (!linkedIds.has(r.id)) next.add(r.id)
      }
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const handleSubmit = async () => {
    if (selected.size === 0) return
    setSubmitting(true)
    try {
      await onSubmit([...selected])
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Link requirements"
      size="full"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: selected.size ? `Link ${selected.size}` : 'Link',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading: submitting,
          disabled: selected.size === 0 || loading,
        },
      ]}
    >
      <div className="mx-auto w-full max-w-6xl space-y-3">
        <Typography variant="small" tone="muted">
          Search on the left, preview details in the middle, then add to the selection on the right.
        </Typography>
        {error ? (
          <Typography variant="small" tone="error">
            {error}
          </Typography>
        ) : null}

        {loading ? (
          <Typography variant="small" tone="muted">
            Loading…
          </Typography>
        ) : all.length === 0 ? (
          <Typography variant="small" tone="muted">
            No requirements in this project yet.
          </Typography>
        ) : (
          <div className="grid min-h-[420px] grid-cols-1 gap-0 border border-neutral-200 lg:grid-cols-[minmax(240px,1fr)_minmax(300px,1.35fr)_minmax(220px,0.95fr)]">
            {/* Left: searchable catalog */}
            <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r">
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
                  <Button size="sm" variant="neutral-flat" onClick={selectFilteredAvailable}>
                    Select filtered
                  </Button>
                  <Typography variant="caption" tone="muted" className="self-center">
                    {filtered.length} shown
                  </Typography>
                </div>
              </div>
              <ul className="min-h-0 max-h-[52vh] flex-1 overflow-y-auto lg:max-h-none">
                {filtered.length === 0 ? (
                  <li className="px-3 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No requirements match.
                    </Typography>
                  </li>
                ) : (
                  filtered.map((r) => {
                    const alreadyLinked = linkedIds.has(r.id)
                    const checked = alreadyLinked || selected.has(r.id)
                    const focusedRow = focusedId === r.id
                    return (
                      <li key={r.id} className="border-b border-neutral-100 last:border-b-0">
                        <div
                          className={cn(
                            'flex items-start gap-2 px-3 py-2 text-sm',
                            focusedRow && 'bg-neutral-100',
                            !focusedRow && !alreadyLinked && 'hover:bg-neutral-50',
                            alreadyLinked && 'bg-neutral-50/80 opacity-70'
                          )}
                        >
                          <Checkbox
                            size="sm"
                            checked={checked}
                            disabled={alreadyLinked}
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
                              {alreadyLinked ? ' · Already linked' : ''}
                            </span>
                          </button>
                        </div>
                      </li>
                    )
                  })
                )}
              </ul>
            </section>

            {/* Middle: detail preview before select */}
            <section className="flex min-h-0 flex-col border-b border-neutral-200 lg:border-b-0 lg:border-r">
              <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
                <Typography variant="small" weight="semibold">
                  Preview
                </Typography>
              </div>
              {!focused ? (
                <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    Select a requirement on the left to preview its details here.
                  </Typography>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
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
                      {focused.priority ? (
                        <Badge variant="soft" tone="neutral">
                          {reqPriorityLabel(focused.priority)}
                        </Badge>
                      ) : null}
                      {focusedAlreadyLinked ? (
                        <Badge variant="soft" tone="warning">
                          Already linked
                        </Badge>
                      ) : null}
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
                    <PreviewField label="Priority" value={reqPriorityLabel(focused.priority)} />
                    <PreviewField
                      label="Type"
                      value={reqTypeLabel(focused)}
                    />
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
                    {focusedAlreadyLinked ? (
                      <Typography variant="small" tone="muted">
                        This requirement is already in the scope package.
                      </Typography>
                    ) : focusedSelected ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        fullWidth
                        onClick={() => toggle(focused.id)}
                      >
                        Remove from selection
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        fullWidth
                        onClick={() => toggle(focused.id)}
                      >
                        Add to selection
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Right: selected queue */}
            <section className="flex min-h-0 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2.5">
                <Typography variant="small" weight="semibold">
                  Selected ({selectedItems.length})
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSelection}
                  disabled={selectedItems.length === 0}
                >
                  Clear
                </Button>
              </div>
              {selectedItems.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    Preview a requirement, then add it here before linking.
                  </Typography>
                </div>
              ) : (
                <ul className="min-h-0 max-h-[52vh] flex-1 overflow-y-auto lg:max-h-none">
                  {selectedItems.map((r) => (
                    <li
                      key={r.id}
                      className={cn(
                        'flex items-start gap-2 border-b border-neutral-100 px-3 py-2 last:border-b-0',
                        focusedId === r.id && 'bg-neutral-50'
                      )}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left text-sm"
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
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 hover:text-neutral-800"
                        onClick={() => removeSelected(r.id)}
                        aria-label={`Remove ${r.code}`}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </Modal>
  )
}
