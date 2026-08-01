'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Checkbox, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useRequirements } from '@/modules/projects/requirements'
import type { Requirement } from '@/modules/projects/requirements'
import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'
import type { NonFunctionalItem } from '../model/functional-catalog'
import * as traceApi from '../api/traceability.api'
import type { TraceLink } from '../api/traceability.api'

/** Drag MIME — drag NFRs onto a focused Requirement. */
const NFR_ASSIGN_MIME = 'application/x-scopery-nfr-to-req-assign'
const NFR_ASSIGN_BULK_MIME = 'application/x-scopery-nfr-to-req-assign-bulk'

const SOURCE_REQUIREMENT = 'REQUIREMENT'
const TARGET_NON_FUNCTIONAL_ITEM = 'NON_FUNCTIONAL_ITEM'

interface NfrDragPayload {
  nonFunctionalItemId: string
  code: string
  title: string
}

interface LinkedNfrEdge {
  key: string
  requirementId: string
  nonFunctionalItemId: string
  nfrCode: string
  nfrTitle: string
  /** Trace link id when from COVERS; null when only FK nonFunctionalItemId */
  linkId: string | null
  fromFk: boolean
}

let activeDrag: NfrDragPayload | null = null
const dragListeners = new Set<() => void>()

function setActiveNfrDrag(payload: NfrDragPayload | null) {
  activeDrag = payload
  dragListeners.forEach((l) => l())
}

function getActiveNfrDrag(): NfrDragPayload | null {
  return activeDrag
}

function subscribeActiveNfrDrag(listener: () => void): () => void {
  dragListeners.add(listener)
  return () => {
    dragListeners.delete(listener)
  }
}

function encodeNfrDrag(payload: NfrDragPayload): string {
  return JSON.stringify(payload)
}

function decodeNfrDrag(raw: string): NfrDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as NfrDragPayload
    if (!parsed?.nonFunctionalItemId) return null
    return parsed
  } catch {
    return null
  }
}

function isCoversReqToNfr(link: TraceLink): boolean {
  return (
    link.sourceType.toUpperCase() === SOURCE_REQUIREMENT &&
    link.targetType.toUpperCase() === TARGET_NON_FUNCTIONAL_ITEM &&
    link.linkType.toUpperCase() === TraceLinkType.Covers
  )
}

interface RequirementNonFunctionalLinkPanelProps {
  workspaceId: string
  projectId: string
  nonFunctionalItems: NonFunctionalItem[]
}

export function RequirementNonFunctionalLinkPanel({
  workspaceId,
  projectId,
  nonFunctionalItems,
}: RequirementNonFunctionalLinkPanelProps) {
  const {
    requirements,
    loading: reqLoading,
    error: reqError,
    updateRequirement,
    refetch: refetchRequirements,
  } = useRequirements(workspaceId, projectId)

  const [coversLinks, setCoversLinks] = useState<TraceLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)

  const [focusReqId, setFocusReqId] = useState<string | null>(null)
  const [reqQuery, setReqQuery] = useState('')
  const [query, setQuery] = useState('')
  const [hideLinked, setHideLinked] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const loadCoversLinks = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLinksLoading(true)
    setLinksError(null)
    try {
      const res = await traceApi.listTraceLinks(projectId, {
        linkType: TraceLinkType.Covers,
        sourceType: SOURCE_REQUIREMENT,
        targetType: TARGET_NON_FUNCTIONAL_ITEM,
        limit: 500,
      })
      setCoversLinks(res.items.filter(isCoversReqToNfr))
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Failed to load links')
      setCoversLinks([])
    } finally {
      if (!opts?.silent) setLinksLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadCoversLinks()
  }, [loadCoversLinks])

  useEffect(() => {
    if (focusReqId && !requirements.some((r) => r.id === focusReqId)) {
      setFocusReqId(requirements[0]?.id ?? null)
    } else if (!focusReqId && requirements[0]?.id) {
      setFocusReqId(requirements[0].id)
    }
  }, [requirements, focusReqId])

  useEffect(() => {
    setSelected(new Set())
    setQuery('')
    setPreviewId(null)
    setFormError(null)
  }, [focusReqId])

  const focusReq = useMemo(
    () => requirements.find((r) => r.id === focusReqId) ?? null,
    [requirements, focusReqId]
  )

  const filteredRequirements = useMemo(() => {
    const q = reqQuery.trim().toLowerCase()
    if (!q) return requirements
    return requirements.filter((r) =>
      [r.code, r.title, r.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    )
  }, [requirements, reqQuery])

  const nfrById = useMemo(() => {
    const map = new Map<string, NonFunctionalItem>()
    for (const item of nonFunctionalItems) map.set(item.id, item)
    return map
  }, [nonFunctionalItems])

  /** All requirement → NFR edges (COVERS links ∪ legacy FK). */
  const edges = useMemo<LinkedNfrEdge[]>(() => {
    const list: LinkedNfrEdge[] = []
    const seen = new Set<string>()

    for (const link of coversLinks) {
      const fr = nfrById.get(link.targetId)
      const key = `${link.sourceId}:${link.targetId}`
      seen.add(key)
      list.push({
        key,
        requirementId: link.sourceId,
        nonFunctionalItemId: link.targetId,
        nfrCode: fr?.code ?? link.targetCode ?? '—',
        nfrTitle: fr?.title ?? link.targetTitle ?? 'Unknown NFR',
        linkId: link.id,
        fromFk: false,
      })
    }

    for (const req of requirements) {
      if (!req.nonFunctionalItemId) continue
      const key = `${req.id}:${req.nonFunctionalItemId}`
      if (seen.has(key)) continue
      const fr = nfrById.get(req.nonFunctionalItemId)
      list.push({
        key,
        requirementId: req.id,
        nonFunctionalItemId: req.nonFunctionalItemId,
        nfrCode: fr?.code ?? '—',
        nfrTitle: fr?.title ?? 'Unknown NFR',
        linkId: null,
        fromFk: true,
      })
    }

    return list
  }, [coversLinks, requirements, nfrById])

  const edgesForFocus = useMemo(
    () => edges.filter((e) => e.requirementId === focusReqId),
    [edges, focusReqId]
  )

  const linkedNfrIdsForFocus = useMemo(
    () => new Set(edgesForFocus.map((e) => e.nonFunctionalItemId)),
    [edgesForFocus]
  )

  const linkCountByReq = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of edges) {
      map.set(e.requirementId, (map.get(e.requirementId) ?? 0) + 1)
    }
    return map
  }, [edges])

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase()
    return nonFunctionalItems.filter((item) => {
      const linkedHere = linkedNfrIdsForFocus.has(item.id)
      if (hideLinked && linkedHere) return false
      if (!q) return true
      return [item.code, item.title, item.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [nonFunctionalItems, linkedNfrIdsForFocus, hideLinked, query])

  const linkedHereCount = edgesForFocus.length

  const selectedPayloads = useMemo(() => {
    const out: NfrDragPayload[] = []
    for (const item of candidates) {
      if (!selected.has(item.id)) continue
      if (linkedNfrIdsForFocus.has(item.id)) continue
      out.push({
        nonFunctionalItemId: item.id,
        code: item.code,
        title: item.title,
      })
    }
    return out
  }, [candidates, selected, linkedNfrIdsForFocus])

  const toggleSelect = (id: string, disabled?: boolean) => {
    if (disabled) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const assignMany = useCallback(
    async (payloads: NfrDragPayload[]) => {
      if (!focusReqId || payloads.length === 0) return
      setAssigning(true)
      setFormError(null)
      try {
        const toCreate = payloads.filter((p) => !linkedNfrIdsForFocus.has(p.nonFunctionalItemId))
        if (toCreate.length === 0) return

        try {
          await traceApi.batchCreateTraceLinks(projectId, {
            links: toCreate.map((p) => ({
              sourceType: SOURCE_REQUIREMENT,
              sourceId: focusReqId,
              targetType: TARGET_NON_FUNCTIONAL_ITEM,
              targetId: p.nonFunctionalItemId,
              linkType: TraceLinkType.Covers,
            })),
          })
        } catch {
          for (const p of toCreate) {
            await traceApi.createTraceLink(projectId, {
              sourceType: SOURCE_REQUIREMENT,
              sourceId: focusReqId,
              targetType: TARGET_NON_FUNCTIONAL_ITEM,
              targetId: p.nonFunctionalItemId,
              linkType: TraceLinkType.Covers,
            })
          }
        }

        // Keep FK in sync as primary pointer (first NFR / if empty)
        const focus = requirements.find((r) => r.id === focusReqId)
        if (focus && !focus.nonFunctionalItemId && toCreate[0]) {
          await updateRequirement(focusReqId, {
            nonFunctionalItemId: toCreate[0].nonFunctionalItemId,
          })
        }

        await loadCoversLinks({ silent: true })
        setSelected(new Set())
        setBulkOpen(false)
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Failed to assign')
      } finally {
        setAssigning(false)
      }
    },
    [
      focusReqId,
      linkedNfrIdsForFocus,
      projectId,
      requirements,
      updateRequirement,
      refetchRequirements,
      loadCoversLinks,
    ]
  )

  const assignOne = useCallback(
    async (payload: NfrDragPayload) => {
      await assignMany([payload])
    },
    [assignMany]
  )

  const unlink = useCallback(
    async (edge: LinkedNfrEdge) => {
      setFormError(null)
      try {
        if (edge.linkId) {
          await traceApi.deleteTraceLink(projectId, edge.linkId)
        }
        const req = requirements.find((r) => r.id === edge.requirementId)
        if (req?.nonFunctionalItemId === edge.nonFunctionalItemId) {
          const remaining = edges.filter(
            (e) =>
              e.requirementId === edge.requirementId &&
              e.nonFunctionalItemId !== edge.nonFunctionalItemId
          )
          await updateRequirement(edge.requirementId, {
            nonFunctionalItemId: remaining[0]?.nonFunctionalItemId ?? null,
          })
        }
        await loadCoversLinks({ silent: true })
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Failed to unlink')
      }
    },
    [projectId, requirements, edges, updateRequirement, loadCoversLinks, refetchRequirements]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && selectedPayloads.length > 0) {
        e.preventDefault()
        setBulkOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedPayloads.length])

  const loading = reqLoading || linksLoading
  const error = reqError || linksError
  const reqWithoutFr = requirements.filter((r) => (linkCountByReq.get(r.id) ?? 0) === 0).length

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
        <div>
          <Typography weight="medium" size="sm">
            Requirement to NFR
          </Typography>
          <Typography variant="small" tone="muted">
            Select a requirement, then drag NFRs onto it. {edges.length} link
            {edges.length === 1 ? '' : 's'}
            {reqWithoutFr ? ` · ${reqWithoutFr} requirement with no NFR` : ''}
          </Typography>
        </div>
      </div>

      {error ? (
        <Typography tone="error" variant="small" className="px-3 py-2">
          {error}
        </Typography>
      ) : null}
      {formError ? (
        <Typography tone="error" variant="small" className="px-3 py-2">
          {formError}
        </Typography>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-neutral-200 lg:border-b-0 lg:border-r">
          <div className="shrink-0 space-y-2 border-b border-neutral-100 px-3 py-2">
            <Typography
              variant="caption"
              tone="muted"
              className="block text-[10px] uppercase tracking-wide"
            >
              Requirements
            </Typography>
            <Input
              fullWidth
              value={reqQuery}
              onChange={(e) => setReqQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search requirements"
              prefix={<Search size={14} />}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {requirements.length === 0 ? (
              <Typography variant="small" tone="muted" className="px-3 py-2">
                No requirements in this project.
              </Typography>
            ) : filteredRequirements.length === 0 ? (
              <Typography variant="small" tone="muted" className="px-3 py-2">
                No requirements match this search.
              </Typography>
            ) : (
              <ul className="space-y-0.5 px-1 pb-2">
                {filteredRequirements.map((item) => {
                  const count = linkCountByReq.get(item.id) ?? 0
                  const active = focusReqId === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setFocusReqId(item.id)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm',
                          active
                            ? 'bg-secondary text-white'
                            : 'text-neutral-900 hover:bg-neutral-100'
                        )}
                      >
                        <div className="truncate font-medium">{item.title}</div>
                        <div
                          className={cn(
                            'truncate text-xs',
                            active ? 'text-white/75' : 'text-neutral-500'
                          )}
                        >
                          {item.code}
                        </div>
                        <div
                          className={cn(
                            'truncate text-xs',
                            active ? 'text-white/60' : 'text-neutral-400'
                          )}
                        >
                          {count === 0
                            ? 'Not linked'
                            : `${count} NFR${count === 1 ? '' : 's'}`}
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </aside>

        {!focusReq ? (
          <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
            <Typography weight="medium">Assignment dock</Typography>
            <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
              Select a requirement to open available NFRs next to the drop zone.
            </Typography>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(280px,1.15fr)_minmax(0,0.85fr)]">
            <NfrCandidatePalette
              focusReq={focusReq}
              candidates={candidates}
              allNfrs={nonFunctionalItems}
              loading={loading}
              hideLinked={hideLinked}
              linkedHereCount={linkedHereCount}
              linkedNfrIds={linkedNfrIdsForFocus}
              selected={selected}
              selectedPayloads={selectedPayloads}
              previewId={previewId}
              query={query}
              onHideLinkedChange={setHideLinked}
              onQueryChange={setQuery}
              onPreview={setPreviewId}
              onToggleSelect={toggleSelect}
              onAssign={assignOne}
              onOpenBulk={() => setBulkOpen(true)}
              onClearSelected={() => setSelected(new Set())}
            />
            <RequirementNfrFocusInspector
              focusReq={focusReq}
              linked={edgesForFocus}
              assigning={assigning}
              onAssignMany={assignMany}
              onUnlink={unlink}
            />
          </div>
        )}
      </div>

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk assign preview"
        size="md"
        actions={[
          { label: 'Cancel', variant: 'ghost', onClick: () => setBulkOpen(false) },
          {
            label: `Assign ${selectedPayloads.length}`,
            variant: 'secondary',
            disabled: assigning || selectedPayloads.length === 0,
            loading: assigning,
            onClick: () => {
              void assignMany(selectedPayloads)
            },
          },
        ]}
      >
        <Typography variant="small" tone="muted" className="mb-2">
          Link {selectedPayloads.length} NFR
          {selectedPayloads.length === 1 ? '' : 's'} to {focusReq?.code ?? 'requirement'}.
        </Typography>
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {selectedPayloads.map((p) => (
            <li key={p.nonFunctionalItemId} className="truncate text-neutral-900">
              {p.code} — {p.title}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

function NfrCandidatePalette({
  focusReq,
  candidates,
  allNfrs,
  loading,
  hideLinked,
  linkedHereCount,
  linkedNfrIds,
  selected,
  selectedPayloads,
  previewId,
  query,
  onHideLinkedChange,
  onQueryChange,
  onPreview,
  onToggleSelect,
  onAssign,
  onOpenBulk,
  onClearSelected,
}: {
  focusReq: Requirement
  candidates: NonFunctionalItem[]
  allNfrs: NonFunctionalItem[]
  loading: boolean
  hideLinked: boolean
  linkedHereCount: number
  linkedNfrIds: Set<string>
  selected: Set<string>
  selectedPayloads: NfrDragPayload[]
  previewId: string | null
  query: string
  onHideLinkedChange: (v: boolean) => void
  onQueryChange: (v: string) => void
  onPreview: (id: string | null) => void
  onToggleSelect: (id: string, disabled?: boolean) => void
  onAssign: (payload: NfrDragPayload) => void
  onOpenBulk: () => void
  onClearSelected: () => void
}) {
  const preview = allNfrs.find((i) => i.id === previewId) ?? null

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
      <div className="shrink-0 space-y-2 border-b border-neutral-100 p-3">
        <Typography weight="medium" size="sm">
          Available to assign
        </Typography>
        <Typography variant="small" tone="muted">
          Showing NFRs for {focusReq.code}. Drag onto the drop zone or use Assign.
        </Typography>
        <Input
          fullWidth
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search…"
          aria-label="Search NFRs"
          prefix={<Search size={14} />}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 bg-neutral-50 px-2.5 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
            <Checkbox
              size="sm"
              checked={hideLinked}
              onChange={(e) => onHideLinkedChange(e.target.checked)}
              aria-label="Hide already assigned items"
            />
            Hide already assigned
            {linkedHereCount > 0 ? (
              <span className="text-neutral-400">({linkedHereCount})</span>
            ) : null}
          </label>
          {!hideLinked ? (
            <button
              type="button"
              className="text-xs text-neutral-500 underline hover:text-neutral-800"
              onClick={() => onHideLinkedChange(true)}
            >
              Hide them
            </button>
          ) : linkedHereCount > 0 ? (
            <button
              type="button"
              className="text-xs text-neutral-500 underline hover:text-neutral-800"
              onClick={() => onHideLinkedChange(false)}
            >
              Show assigned
            </button>
          ) : null}
        </div>
        {selectedPayloads.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Typography variant="small" tone="muted">
              {selectedPayloads.length} selected
            </Typography>
            <Button size="sm" variant="secondary" onClick={onOpenBulk}>
              Assign selected
            </Button>
            <Button size="sm" variant="ghost" onClick={onClearSelected}>
              Clear
            </Button>
          </div>
        ) : null}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-2"
        onMouseLeave={() => onPreview(null)}
      >
        {loading && candidates.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            Loading candidates…
          </Typography>
        ) : candidates.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            {hideLinked
              ? 'No unassigned NFRs. Click “Show assigned” to review linked items.'
              : 'No NFRs match this search.'}
          </Typography>
        ) : (
          <ul className="space-y-0.5">
            {candidates.map((item) => {
              const linkedHere = linkedNfrIds.has(item.id)
              const disabled = linkedHere
              return (
                <li key={item.id}>
                  <div
                    draggable={!disabled}
                    onMouseEnter={() => onPreview(item.id)}
                    onFocus={() => onPreview(item.id)}
                    onDragStart={(e) => {
                      if (disabled) {
                        e.preventDefault()
                        return
                      }
                      const payloads =
                        selectedPayloads.length > 1 && selected.has(item.id)
                          ? selectedPayloads
                          : [
                              {
                                nonFunctionalItemId: item.id,
                                code: item.code,
                                title: item.title,
                              },
                            ]
                      if (!payloads.length) {
                        e.preventDefault()
                        return
                      }
                      setActiveNfrDrag(payloads[0])
                      e.dataTransfer.setData(NFR_ASSIGN_MIME, encodeNfrDrag(payloads[0]))
                      e.dataTransfer.setData(
                        NFR_ASSIGN_BULK_MIME,
                        JSON.stringify(payloads)
                      )
                      e.dataTransfer.effectAllowed = 'link'
                    }}
                    onDragEnd={() => setActiveNfrDrag(null)}
                    onClick={(e) => {
                      if (disabled) return
                      if ((e.target as HTMLElement).closest('input, button, label')) return
                      onToggleSelect(item.id)
                    }}
                    className={cn(
                      'flex items-start gap-2 border border-transparent px-2.5 py-2',
                      disabled
                        ? 'opacity-60'
                        : 'cursor-grab hover:bg-secondary/5 active:cursor-grabbing',
                      selected.has(item.id) && 'bg-secondary/10',
                      previewId === item.id && 'bg-neutral-50'
                    )}
                  >
                    {!disabled ? (
                      <Checkbox
                        size="sm"
                        checked={selected.has(item.id)}
                        onChange={() => onToggleSelect(item.id)}
                        aria-label={`Select ${item.title}`}
                      />
                    ) : (
                      <span className="w-4" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-neutral-900">
                        {item.title}
                      </div>
                      <div className="truncate text-xs text-neutral-500">
                        {item.code}
                        {linkedHere ? ' · Already linked' : ''}
                      </div>
                    </div>
                    {disabled ? null : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void onAssign({
                            nonFunctionalItemId: item.id,
                            code: item.code,
                            title: item.title,
                          })
                        }
                      >
                        Assign
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-neutral-100 bg-neutral-50 px-3 py-2.5">
        {preview ? (
          <>
            <div className="truncate text-xs font-medium text-neutral-900">
              {preview.title}
              <span className="ml-1 font-normal text-neutral-500">({preview.code})</span>
            </div>
            <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-neutral-600">
              {preview.description?.trim() || 'No description'}
            </p>
          </>
        ) : (
          <Typography variant="small" tone="muted">
            Hover an NFR for details. Drag onto the drop zone to link.
          </Typography>
        )}
      </div>
    </div>
  )
}

function RequirementNfrFocusInspector({
  focusReq,
  linked,
  assigning,
  onAssignMany,
  onUnlink,
}: {
  focusReq: Requirement
  linked: LinkedNfrEdge[]
  assigning: boolean
  onAssignMany: (payloads: NfrDragPayload[]) => void
  onUnlink: (edge: LinkedNfrEdge) => void
}) {
  const [activeDrop, setActiveDrop] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragPayload, setDragPayload] = useState<NfrDragPayload | null>(null)

  useEffect(() => subscribeActiveNfrDrag(() => setDragPayload(getActiveNfrDrag())), [])

  const resolvePayload = (e: React.DragEvent): NfrDragPayload | null => {
    return getActiveNfrDrag() || decodeNfrDrag(e.dataTransfer.getData(NFR_ASSIGN_MIME))
  }

  const resolveBulk = (e: React.DragEvent): NfrDragPayload[] => {
    try {
      const raw = e.dataTransfer.getData(NFR_ASSIGN_BULK_MIME)
      if (raw) {
        const parsed = JSON.parse(raw) as NfrDragPayload[]
        if (Array.isArray(parsed) && parsed.length) return parsed
      }
    } catch {
      /* ignore */
    }
    const one = resolvePayload(e)
    return one ? [one] : []
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
        <Typography weight="medium" size="sm">
          {focusReq.code}
        </Typography>
        <Typography variant="small" tone="muted" className="truncate">
          Requirement · {focusReq.title}
        </Typography>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-2 p-3">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              const payload = resolvePayload(e) || dragPayload
              setActiveDrop(true)
              if (payload) {
                e.dataTransfer.dropEffect = 'link'
                setPreview(`Link ${payload.code} → ${focusReq.code}`)
              } else {
                e.dataTransfer.dropEffect = 'link'
                setPreview('Drop NFRs here')
              }
            }}
            onDragLeave={() => {
              setActiveDrop(false)
              setPreview(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setActiveDrop(false)
              setPreview(null)
              const payloads = resolveBulk(e)
              setActiveNfrDrag(null)
              if (!payloads.length) return
              void onAssignMany(payloads)
            }}
            className={cn(
              'min-h-[72px] border border-dashed p-3 transition-colors',
              activeDrop
                ? 'border-secondary bg-secondary/10'
                : 'border-secondary/30 bg-white'
            )}
          >
            <Typography
              variant="small"
              className="text-xs font-medium uppercase tracking-wide text-neutral-900"
            >
              NFRs
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {activeDrop && preview
                ? preview
                : 'Drop NFRs here to link them to this requirement'}
            </Typography>
          </div>
          {assigning ? (
            <Typography variant="small" tone="muted">
              Assigning…
            </Typography>
          ) : null}
        </div>

        <div className="border-t border-neutral-100 px-3 py-3">
          <Typography variant="small" tone="muted" className="mb-2 block">
            Linked NFRs ({linked.length})
          </Typography>
          {linked.length === 0 ? (
            <Typography variant="small" tone="muted">
              None yet. Drag from Available to assign, or click Assign.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {linked.map((edge) => (
                <li
                  key={edge.key}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-neutral-900">{edge.nfrCode}</div>
                    <div className="truncate text-xs text-neutral-500">{edge.nfrTitle}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => void onUnlink(edge)}>
                    Unlink
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
