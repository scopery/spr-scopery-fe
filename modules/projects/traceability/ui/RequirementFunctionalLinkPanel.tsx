'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useRequirements } from '@/modules/projects/requirements'
import type { Requirement } from '@/modules/projects/requirements'
import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'
import type { FunctionalItem } from '../model/functional-catalog'
import * as traceApi from '../api/traceability.api'
import type { TraceLink } from '../api/traceability.api'

/** Drag MIME — drag Functions onto a focused Requirement. */
const FR_ASSIGN_MIME = 'application/x-scopery-fr-to-req-assign'
const FR_ASSIGN_BULK_MIME = 'application/x-scopery-fr-to-req-assign-bulk'

const SOURCE_REQUIREMENT = 'REQUIREMENT'
const TARGET_FUNCTIONAL_ITEM = 'FUNCTIONAL_ITEM'

interface FrDragPayload {
  functionalItemId: string
  code: string
  title: string
}

interface LinkedFrEdge {
  key: string
  requirementId: string
  functionalItemId: string
  frCode: string
  frTitle: string
  /** Trace link id when from COVERS; null when only FK functionalItemId */
  linkId: string | null
  fromFk: boolean
}

let activeDrag: FrDragPayload | null = null
const dragListeners = new Set<() => void>()

function setActiveFrDrag(payload: FrDragPayload | null) {
  activeDrag = payload
  dragListeners.forEach((l) => l())
}

function getActiveFrDrag(): FrDragPayload | null {
  return activeDrag
}

function subscribeActiveFrDrag(listener: () => void): () => void {
  dragListeners.add(listener)
  return () => {
    dragListeners.delete(listener)
  }
}

function encodeFrDrag(payload: FrDragPayload): string {
  return JSON.stringify(payload)
}

function decodeFrDrag(raw: string): FrDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as FrDragPayload
    if (!parsed?.functionalItemId) return null
    return parsed
  } catch {
    return null
  }
}

function isCoversReqToFr(link: TraceLink): boolean {
  return (
    link.sourceType.toUpperCase() === SOURCE_REQUIREMENT &&
    link.targetType.toUpperCase() === TARGET_FUNCTIONAL_ITEM &&
    link.linkType.toUpperCase() === TraceLinkType.Covers
  )
}

interface RequirementFunctionalLinkPanelProps {
  workspaceId: string
  projectId: string
  functionalItems: FunctionalItem[]
}

export function RequirementFunctionalLinkPanel({
  workspaceId,
  projectId,
  functionalItems,
}: RequirementFunctionalLinkPanelProps) {
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

  const loadCoversLinks = useCallback(async () => {
    setLinksLoading(true)
    setLinksError(null)
    try {
      const res = await traceApi.listTraceLinks(projectId, {
        linkType: TraceLinkType.Covers,
        sourceType: SOURCE_REQUIREMENT,
        targetType: TARGET_FUNCTIONAL_ITEM,
        limit: 500,
      })
      setCoversLinks(res.items.filter(isCoversReqToFr))
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : 'Failed to load links')
      setCoversLinks([])
    } finally {
      setLinksLoading(false)
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

  const frById = useMemo(() => {
    const map = new Map<string, FunctionalItem>()
    for (const item of functionalItems) map.set(item.id, item)
    return map
  }, [functionalItems])

  /** All requirement → FR edges (COVERS links ∪ legacy FK). */
  const edges = useMemo<LinkedFrEdge[]>(() => {
    const list: LinkedFrEdge[] = []
    const seen = new Set<string>()

    for (const link of coversLinks) {
      const fr = frById.get(link.targetId)
      const key = `${link.sourceId}:${link.targetId}`
      seen.add(key)
      list.push({
        key,
        requirementId: link.sourceId,
        functionalItemId: link.targetId,
        frCode: fr?.code ?? link.targetCode ?? link.targetId.slice(0, 8) + '…',
        frTitle: fr?.title ?? link.targetTitle ?? 'Unknown function',
        linkId: link.id,
        fromFk: false,
      })
    }

    for (const req of requirements) {
      if (!req.functionalItemId) continue
      const key = `${req.id}:${req.functionalItemId}`
      if (seen.has(key)) continue
      const fr = frById.get(req.functionalItemId)
      list.push({
        key,
        requirementId: req.id,
        functionalItemId: req.functionalItemId,
        frCode: fr?.code ?? req.functionalItemId.slice(0, 8) + '…',
        frTitle: fr?.title ?? 'Unknown function',
        linkId: null,
        fromFk: true,
      })
    }

    return list
  }, [coversLinks, requirements, frById])

  const edgesForFocus = useMemo(
    () => edges.filter((e) => e.requirementId === focusReqId),
    [edges, focusReqId]
  )

  const linkedFrIdsForFocus = useMemo(
    () => new Set(edgesForFocus.map((e) => e.functionalItemId)),
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
    return functionalItems.filter((item) => {
      const linkedHere = linkedFrIdsForFocus.has(item.id)
      if (hideLinked && linkedHere) return false
      if (!q) return true
      return [item.code, item.title, item.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [functionalItems, linkedFrIdsForFocus, hideLinked, query])

  const linkedHereCount = edgesForFocus.length

  const selectedPayloads = useMemo(() => {
    const out: FrDragPayload[] = []
    for (const item of candidates) {
      if (!selected.has(item.id)) continue
      if (linkedFrIdsForFocus.has(item.id)) continue
      out.push({
        functionalItemId: item.id,
        code: item.code,
        title: item.title,
      })
    }
    return out
  }, [candidates, selected, linkedFrIdsForFocus])

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
    async (payloads: FrDragPayload[]) => {
      if (!focusReqId || payloads.length === 0) return
      setAssigning(true)
      setFormError(null)
      try {
        const toCreate = payloads.filter((p) => !linkedFrIdsForFocus.has(p.functionalItemId))
        if (toCreate.length === 0) return

        try {
          await traceApi.batchCreateTraceLinks(projectId, {
            links: toCreate.map((p) => ({
              sourceType: SOURCE_REQUIREMENT,
              sourceId: focusReqId,
              targetType: TARGET_FUNCTIONAL_ITEM,
              targetId: p.functionalItemId,
              linkType: TraceLinkType.Covers,
            })),
          })
        } catch {
          for (const p of toCreate) {
            await traceApi.createTraceLink(projectId, {
              sourceType: SOURCE_REQUIREMENT,
              sourceId: focusReqId,
              targetType: TARGET_FUNCTIONAL_ITEM,
              targetId: p.functionalItemId,
              linkType: TraceLinkType.Covers,
            })
          }
        }

        // Keep FK in sync as primary pointer (first FR / if empty)
        const focus = requirements.find((r) => r.id === focusReqId)
        if (focus && !focus.functionalItemId && toCreate[0]) {
          await updateRequirement(focusReqId, {
            functionalItemId: toCreate[0].functionalItemId,
          })
        } else {
          await refetchRequirements()
        }

        await loadCoversLinks()
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
      linkedFrIdsForFocus,
      projectId,
      requirements,
      updateRequirement,
      refetchRequirements,
      loadCoversLinks,
    ]
  )

  const assignOne = useCallback(
    async (payload: FrDragPayload) => {
      await assignMany([payload])
    },
    [assignMany]
  )

  const unlink = useCallback(
    async (edge: LinkedFrEdge) => {
      setFormError(null)
      try {
        if (edge.linkId) {
          await traceApi.deleteTraceLink(projectId, edge.linkId)
        }
        const req = requirements.find((r) => r.id === edge.requirementId)
        if (req?.functionalItemId === edge.functionalItemId) {
          const remaining = edges.filter(
            (e) =>
              e.requirementId === edge.requirementId &&
              e.functionalItemId !== edge.functionalItemId
          )
          await updateRequirement(edge.requirementId, {
            functionalItemId: remaining[0]?.functionalItemId ?? null,
          })
        }
        await loadCoversLinks()
        await refetchRequirements()
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
            Requirement to Function
          </Typography>
          <Typography variant="small" tone="muted">
            Select a requirement, then drag functions onto it. {edges.length} link
            {edges.length === 1 ? '' : 's'}
            {reqWithoutFr ? ` · ${reqWithoutFr} requirement with no function` : ''}
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
                          active ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100'
                        )}
                      >
                        <div className="truncate font-medium">{item.code}</div>
                        <div
                          className={cn(
                            'truncate text-xs',
                            active ? 'text-neutral-300' : 'text-neutral-500'
                          )}
                        >
                          {item.title}
                        </div>
                        <div
                          className={cn(
                            'truncate text-xs',
                            active ? 'text-neutral-400' : 'text-neutral-400'
                          )}
                        >
                          {count === 0
                            ? 'Not linked'
                            : `${count} function${count === 1 ? '' : 's'}`}
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
              Select a requirement to open available functions next to the drop zone.
            </Typography>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(280px,1.15fr)_minmax(0,0.85fr)]">
            <FunctionCandidatePalette
              focusReq={focusReq}
              candidates={candidates}
              allFunctions={functionalItems}
              loading={loading}
              hideLinked={hideLinked}
              linkedHereCount={linkedHereCount}
              linkedFrIds={linkedFrIdsForFocus}
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
            <RequirementFocusInspector
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
          Link {selectedPayloads.length} function
          {selectedPayloads.length === 1 ? '' : 's'} to {focusReq?.code ?? 'requirement'}.
        </Typography>
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {selectedPayloads.map((p) => (
            <li key={p.functionalItemId} className="truncate text-neutral-900">
              {p.code} — {p.title}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

function FunctionCandidatePalette({
  focusReq,
  candidates,
  allFunctions,
  loading,
  hideLinked,
  linkedHereCount,
  linkedFrIds,
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
  candidates: FunctionalItem[]
  allFunctions: FunctionalItem[]
  loading: boolean
  hideLinked: boolean
  linkedHereCount: number
  linkedFrIds: Set<string>
  selected: Set<string>
  selectedPayloads: FrDragPayload[]
  previewId: string | null
  query: string
  onHideLinkedChange: (v: boolean) => void
  onQueryChange: (v: string) => void
  onPreview: (id: string | null) => void
  onToggleSelect: (id: string, disabled?: boolean) => void
  onAssign: (payload: FrDragPayload) => void
  onOpenBulk: () => void
  onClearSelected: () => void
}) {
  const preview = allFunctions.find((i) => i.id === previewId) ?? null

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
      <div className="shrink-0 space-y-2 border-b border-neutral-100 p-3">
        <Typography weight="medium" size="sm">
          Available to assign
        </Typography>
        <Typography variant="small" tone="muted">
          Showing functions for {focusReq.code}. Drag onto the drop zone or use Assign.
        </Typography>
        <Input
          fullWidth
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search…"
          aria-label="Search functions"
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
        {loading ? (
          <Typography variant="small" tone="muted" className="p-2">
            Loading candidates…
          </Typography>
        ) : candidates.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            {hideLinked
              ? 'No unassigned functions. Click “Show assigned” to review linked items.'
              : 'No functions match this search.'}
          </Typography>
        ) : (
          <ul className="space-y-0.5">
            {candidates.map((item) => {
              const linkedHere = linkedFrIds.has(item.id)
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
                                functionalItemId: item.id,
                                code: item.code,
                                title: item.title,
                              },
                            ]
                      if (!payloads.length) {
                        e.preventDefault()
                        return
                      }
                      setActiveFrDrag(payloads[0])
                      e.dataTransfer.setData(FR_ASSIGN_MIME, encodeFrDrag(payloads[0]))
                      e.dataTransfer.setData(
                        FR_ASSIGN_BULK_MIME,
                        JSON.stringify(payloads)
                      )
                      e.dataTransfer.effectAllowed = 'link'
                    }}
                    onDragEnd={() => setActiveFrDrag(null)}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey) {
                        onToggleSelect(item.id, disabled)
                      }
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
                            functionalItemId: item.id,
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
            Hover a function for details. Drag onto the drop zone to link.
          </Typography>
        )}
      </div>
    </div>
  )
}

function RequirementFocusInspector({
  focusReq,
  linked,
  assigning,
  onAssignMany,
  onUnlink,
}: {
  focusReq: Requirement
  linked: LinkedFrEdge[]
  assigning: boolean
  onAssignMany: (payloads: FrDragPayload[]) => void
  onUnlink: (edge: LinkedFrEdge) => void
}) {
  const [activeDrop, setActiveDrop] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragPayload, setDragPayload] = useState<FrDragPayload | null>(null)

  useEffect(() => subscribeActiveFrDrag(() => setDragPayload(getActiveFrDrag())), [])

  const resolvePayload = (e: React.DragEvent): FrDragPayload | null => {
    return getActiveFrDrag() || decodeFrDrag(e.dataTransfer.getData(FR_ASSIGN_MIME))
  }

  const resolveBulk = (e: React.DragEvent): FrDragPayload[] => {
    try {
      const raw = e.dataTransfer.getData(FR_ASSIGN_BULK_MIME)
      if (raw) {
        const parsed = JSON.parse(raw) as FrDragPayload[]
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
                setPreview('Drop functions here')
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
              setActiveFrDrag(null)
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
              Functions
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {activeDrop && preview
                ? preview
                : 'Drop functions here to link them to this requirement'}
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
            Linked functions ({linked.length})
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
                    <div className="truncate text-sm text-neutral-900">{edge.frCode}</div>
                    <div className="truncate text-xs text-neutral-500">{edge.frTitle}</div>
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
