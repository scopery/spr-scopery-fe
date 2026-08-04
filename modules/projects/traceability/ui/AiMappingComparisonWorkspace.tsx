'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from 'lucide-react'
import { Button, Checkbox, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  isMultiSelectRelation,
  matchBandLabel,
  matchScoreDisplay,
  type MappingSourceGroup,
} from '../model/mapping-source-groups.rules'
import {
  MappingRelationType,
  type EntityLabel,
  type MappingRelationType as MappingRelationTypeValue,
  type MappingSuggestion,
} from '../model/mapping-suggestions'
import { loadMappingCandidates } from '../model/mapping-candidates'

interface AiMappingComparisonWorkspaceProps {
  projectId: string
  relationType: MappingRelationTypeValue
  reviewQueue: MappingSourceGroup[]
  activeSourceId: string | null
  onActiveSourceIdChange: (id: string) => void
  sourceSelections: Map<string, Set<string>>
  extraTargets: Map<string, EntityLabel[]>
  onToggleTarget: (sourceId: string, targetId: string) => void
  onAddExtra: (sourceId: string, label: EntityLabel) => void
  onApproveAndNext: (sourceId: string) => void
  onLeaveUnmapped: (sourceId: string) => void
  getLabel: (id: string | null | undefined) => EntityLabel
  busy?: boolean
  showCandidateLimit?: number
}

function sourcePaneTitle(type: MappingRelationTypeValue): string {
  if (type === MappingRelationType.RequirementToFunction) return 'Requirement'
  if (type === MappingRelationType.FunctionToUseCase) return 'Use Case'
  return 'Test Case'
}

function candidatePaneTitle(type: MappingRelationTypeValue): string {
  if (type === MappingRelationType.UseCaseToTestCase) return 'Use Case candidates'
  return 'Function candidates'
}

export function AiMappingComparisonWorkspace({
  projectId,
  relationType,
  reviewQueue,
  activeSourceId,
  onActiveSourceIdChange,
  sourceSelections,
  extraTargets,
  onToggleTarget,
  onAddExtra,
  onApproveAndNext,
  onLeaveUnmapped,
  getLabel,
  busy,
  showCandidateLimit = 3,
}: AiMappingComparisonWorkspaceProps) {
  const multi = isMultiSelectRelation(relationType)
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addQuery, setAddQuery] = useState('')
  const [addItems, setAddItems] = useState<EntityLabel[]>([])
  const [addLoading, setAddLoading] = useState(false)

  const activeIndex = Math.max(
    0,
    reviewQueue.findIndex((g) => g.sourceId === activeSourceId)
  )
  const activeGroup = reviewQueue[activeIndex] ?? reviewQueue[0] ?? null

  useEffect(() => {
    if (!activeGroup) return
    if (activeSourceId !== activeGroup.sourceId) {
      onActiveSourceIdChange(activeGroup.sourceId)
    }
  }, [activeGroup, activeSourceId, onActiveSourceIdChange])

  useEffect(() => {
    setExpanded(false)
    setAdding(false)
    setAddQuery('')
  }, [activeGroup?.sourceId])

  useEffect(() => {
    if (!adding || !activeGroup) return
    let cancelled = false
    const t = window.setTimeout(() => {
      setAddLoading(true)
      void loadMappingCandidates(projectId, relationType, activeGroup.sourceId, addQuery)
        .then((list) => {
          if (!cancelled) setAddItems(list)
        })
        .finally(() => {
          if (!cancelled) setAddLoading(false)
        })
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [adding, addQuery, projectId, relationType, activeGroup?.sourceId])

  const selected = activeGroup
    ? sourceSelections.get(activeGroup.sourceId) ?? new Set()
    : new Set<string>()
  const extras = activeGroup ? extraTargets.get(activeGroup.sourceId) ?? [] : []

  const visibleCandidates = useMemo(() => {
    if (!activeGroup) return [] as MappingSuggestion[]
    if (expanded) return activeGroup.candidates
    return activeGroup.candidates.slice(0, showCandidateLimit)
  }, [activeGroup, expanded, showCandidateLimit])

  const source = activeGroup ? getLabel(activeGroup.sourceId) : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }
      if (!activeGroup || busy) return
      const key = e.key.toLowerCase()
      if (key === 'enter') {
        e.preventDefault()
        onApproveAndNext(activeGroup.sourceId)
        return
      }
      if (key === 'u') {
        e.preventDefault()
        void onLeaveUnmapped(activeGroup.sourceId)
        return
      }
      if (key === 'a') {
        e.preventDefault()
        setAdding(true)
        return
      }
      if (key === 'arrowleft' || key === 'k') {
        e.preventDefault()
        const prev = reviewQueue[activeIndex - 1]
        if (prev) onActiveSourceIdChange(prev.sourceId)
        return
      }
      if (key === 'arrowright' || key === 'j') {
        e.preventDefault()
        const next = reviewQueue[activeIndex + 1]
        if (next) onActiveSourceIdChange(next.sourceId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    activeGroup,
    busy,
    onApproveAndNext,
    onLeaveUnmapped,
    reviewQueue,
    activeIndex,
    onActiveSourceIdChange,
  ])

  if (!activeGroup || !source) {
    return (
      <div className="border border-dashed border-neutral-200 px-4 py-10 text-center">
        <Typography tone="muted" size="sm">
          Nothing left to review. Apply the draft mappings when ready.
        </Typography>
      </div>
    )
  }

  const selectedCount = selected.size

  return (
    <div className="flex min-h-[420px] flex-col overflow-hidden border border-neutral-200 bg-white">
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(160px,20%)_minmax(0,35%)_minmax(0,45%)]">
        {/* Queue */}
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-neutral-100 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
            <Typography variant="caption" tone="muted" className="uppercase tracking-wide">
              Needs review {reviewQueue.length}
            </Typography>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {reviewQueue.map((g, i) => {
              const label = getLabel(g.sourceId)
              const active = g.sourceId === activeGroup.sourceId
              return (
                <li key={g.sourceId}>
                  <button
                    type="button"
                    onClick={() => onActiveSourceIdChange(g.sourceId)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm [overflow-wrap:anywhere]',
                      active
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-800 hover:bg-neutral-50'
                    )}
                  >
                    <div className="font-medium">{label.code}</div>
                    <div className={cn('text-xs', active ? 'text-white/70' : 'text-neutral-500')}>
                      {i === activeIndex ? 'Reviewing' : label.name}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Source detail — sticky */}
        <section className="min-h-0 overflow-y-auto border-b border-neutral-100 lg:border-b-0 lg:border-r">
          <div className="sticky top-0 space-y-4 bg-white p-4">
            <div>
              <Typography variant="caption" tone="muted" className="uppercase tracking-wide">
                {sourcePaneTitle(relationType)}
              </Typography>
              <Typography weight="medium" size="sm" className="mt-1 [overflow-wrap:anywhere]">
                {source.code}
              </Typography>
              <Typography size="sm" className="mt-0.5 text-neutral-900 [overflow-wrap:anywhere]">
                {source.name}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" tone="muted" className="mb-1 block uppercase tracking-wide">
                Description
              </Typography>
              {source.description?.trim() ? (
                <Typography
                  size="sm"
                  className="whitespace-pre-wrap text-neutral-800 [overflow-wrap:anywhere]"
                >
                  {source.description}
                </Typography>
              ) : (
                <Typography variant="small" tone="muted">
                  No description.
                </Typography>
              )}
            </div>

            {source.acceptanceCriteria && source.acceptanceCriteria.length > 0 ? (
              <div>
                <Typography
                  variant="caption"
                  tone="muted"
                  className="mb-1 block uppercase tracking-wide"
                >
                  Acceptance criteria
                </Typography>
                <ul className="space-y-1.5">
                  {source.acceptanceCriteria.map((c) => (
                    <li
                      key={c}
                      className="flex gap-2 text-sm text-neutral-800 [overflow-wrap:anywhere]"
                    >
                      <Check size={14} className="mt-0.5 shrink-0 text-neutral-500" aria-hidden />
                      <span className="whitespace-pre-wrap">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {source.moduleLabel ? (
              <div>
                <Typography
                  variant="caption"
                  tone="muted"
                  className="mb-1 block uppercase tracking-wide"
                >
                  Module
                </Typography>
                <Typography size="sm" className="[overflow-wrap:anywhere]">
                  {source.moduleLabel}
                </Typography>
              </div>
            ) : null}
          </div>
        </section>

        {/* Candidates */}
        <section className="flex min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-neutral-100 px-4 py-2">
            <Typography weight="medium" size="sm">
              {candidatePaneTitle(relationType)}
            </Typography>
            <Typography variant="caption" tone="muted">
              {activeGroup.candidates.length + extras.length} candidate
              {activeGroup.candidates.length + extras.length === 1 ? '' : 's'}
              {multi ? ' · multi-select' : ' · pick one'}
            </Typography>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <ul className="space-y-3">
              {visibleCandidates.map((s) => {
                const target = s.targetId ? getLabel(s.targetId) : null
                if (!target || !s.targetId) return null
                const checked = selected.has(s.targetId)
                const band = matchBandLabel(s)
                const score = matchScoreDisplay(s)
                return (
                  <li
                    key={s.id}
                    className={cn(
                      'border border-neutral-200 px-3 py-3',
                      checked && 'border-neutral-800 bg-neutral-50'
                    )}
                  >
                    <label className="flex cursor-pointer items-start gap-2">
                      {multi ? (
                        <Checkbox
                          size="sm"
                          checked={checked}
                          onChange={() => onToggleTarget(activeGroup.sourceId, s.targetId!)}
                          className="mt-0.5"
                          aria-label={`Select ${target.code}`}
                        />
                      ) : (
                        <input
                          type="radio"
                          name={`map-target-${activeGroup.sourceId}`}
                          checked={checked}
                          onChange={() => onToggleTarget(activeGroup.sourceId, s.targetId!)}
                          className="mt-1 h-4 w-4 border-neutral-300"
                          aria-label={`Select ${target.code}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900 [overflow-wrap:anywhere]">
                          {target.code} · {target.name}
                        </div>
                        <div className="mt-0.5 text-xs text-neutral-600">
                          {band}
                          {score != null ? ` · Match score ${score}` : ''}
                        </div>

                        {target.description?.trim() ? (
                          <div className="mt-2">
                            <Typography
                              variant="caption"
                              tone="muted"
                              className="uppercase tracking-wide"
                            >
                              Purpose
                            </Typography>
                            <Typography
                              size="sm"
                              className="mt-0.5 whitespace-pre-wrap text-neutral-800 [overflow-wrap:anywhere]"
                            >
                              {target.description}
                            </Typography>
                          </div>
                        ) : null}

                        {s.evidence.length > 0 ? (
                          <div className="mt-2">
                            <Typography
                              variant="caption"
                              tone="muted"
                              className="uppercase tracking-wide"
                            >
                              Covers
                            </Typography>
                            <ul className="mt-1 space-y-1">
                              {s.evidence.map((e) => (
                                <li
                                  key={e}
                                  className="flex gap-2 text-sm text-neutral-800 [overflow-wrap:anywhere]"
                                >
                                  <Check
                                    size={14}
                                    className="mt-0.5 shrink-0 text-neutral-600"
                                    aria-hidden
                                  />
                                  <span className="whitespace-pre-wrap">{e}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {s.warnings.length > 0 ? (
                          <div className="mt-2">
                            <Typography
                              variant="caption"
                              tone="muted"
                              className="uppercase tracking-wide"
                            >
                              Missing / warnings
                            </Typography>
                            <ul className="mt-1 space-y-1">
                              {s.warnings.map((w) => (
                                <li
                                  key={w}
                                  className="flex gap-2 text-sm text-neutral-800 [overflow-wrap:anywhere]"
                                >
                                  <AlertTriangle
                                    size={14}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                    aria-hidden
                                  />
                                  <span className="whitespace-pre-wrap">{w}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </label>
                  </li>
                )
              })}

              {extras.map((label) => {
                const checked = selected.has(label.id)
                return (
                  <li
                    key={`extra-${label.id}`}
                    className={cn(
                      'border border-neutral-200 px-3 py-3',
                      checked && 'border-neutral-800 bg-neutral-50'
                    )}
                  >
                    <label className="flex cursor-pointer items-start gap-2">
                      {multi ? (
                        <Checkbox
                          size="sm"
                          checked={checked}
                          onChange={() => onToggleTarget(activeGroup.sourceId, label.id)}
                          className="mt-0.5"
                        />
                      ) : (
                        <input
                          type="radio"
                          name={`map-target-${activeGroup.sourceId}`}
                          checked={checked}
                          onChange={() => onToggleTarget(activeGroup.sourceId, label.id)}
                          className="mt-1 h-4 w-4 border-neutral-300"
                        />
                      )}
                      <div className="text-sm [overflow-wrap:anywhere]">
                        <span className="font-medium">
                          {label.code} · {label.name}
                        </span>
                        <div className="text-xs text-neutral-500">Added manually</div>
                      </div>
                    </label>
                  </li>
                )
              })}
            </ul>

            {!expanded && activeGroup.candidates.length > showCandidateLimit ? (
              <button
                type="button"
                className="mt-3 text-xs text-neutral-600 underline hover:text-neutral-900"
                onClick={() => setExpanded(true)}
              >
                Show {activeGroup.candidates.length - showCandidateLimit} more
              </button>
            ) : null}

            <div className="mt-3">
              {!adding ? (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={14} />}
                  disabled={busy}
                  onClick={() => setAdding(true)}
                >
                  Add another Function
                </Button>
              ) : (
                <div className="border border-neutral-200 bg-neutral-50 p-2">
                  <Input
                    fullWidth
                    value={addQuery}
                    onChange={(e) => setAddQuery(e.target.value)}
                    placeholder="Search Functions…"
                    aria-label="Search functions"
                    prefix={<Search size={14} />}
                  />
                  <div className="mt-2 max-h-40 space-y-0.5 overflow-y-auto">
                    {addLoading ? (
                      <Typography variant="small" tone="muted">
                        Loading…
                      </Typography>
                    ) : (
                      addItems.slice(0, 20).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="block w-full px-2 py-1.5 text-left text-sm hover:bg-white [overflow-wrap:anywhere]"
                          onClick={() => {
                            onAddExtra(activeGroup.sourceId, item)
                            setAdding(false)
                            setAddQuery('')
                          }}
                        >
                          <span className="font-medium">{item.code}</span>
                          <span className="text-neutral-500"> · {item.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1"
                    onClick={() => setAdding(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Sticky footer */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <button
            type="button"
            className="inline-flex items-center gap-1 disabled:opacity-40"
            disabled={activeIndex <= 0 || busy}
            onClick={() => {
              const prev = reviewQueue[activeIndex - 1]
              if (prev) onActiveSourceIdChange(prev.sourceId)
            }}
          >
            <ChevronLeft size={16} aria-hidden />
            Previous
          </button>
          <span>
            {activeIndex + 1} of {reviewQueue.length}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 disabled:opacity-40"
            disabled={activeIndex >= reviewQueue.length - 1 || busy}
            onClick={() => {
              const next = reviewQueue[activeIndex + 1]
              if (next) onActiveSourceIdChange(next.sourceId)
            }}
          >
            Next
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Typography variant="small" tone="muted">
            {selectedCount} selected · Enter approve · U leave unmapped · A add
          </Typography>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              void onLeaveUnmapped(activeGroup.sourceId)
            }}
          >
            Leave Unmapped
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onApproveAndNext(activeGroup.sourceId)}
          >
            Approve & Next
          </Button>
        </div>
      </div>
    </div>
  )
}
