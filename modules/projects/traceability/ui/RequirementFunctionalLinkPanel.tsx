'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button, Checkbox, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useRequirements } from '@/modules/projects/requirements'
import type { Requirement } from '@/modules/projects/requirements'
import { getRequirement } from '@/modules/projects/requirements/api/requirements.api'
import {
  canMutateRequirementLinks,
  normalizeRequirementStatus,
  RequirementImmutableMessages,
  RequirementStatus,
} from '@/modules/projects/requirements/model/requirement-status'
import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'
import type { FunctionalItem } from '../model/functional-catalog'
import * as useCaseApi from '../api/use-case.api'
import * as traceApi from '../api/traceability.api'
import type { TraceLink } from '../api/traceability.api'
import { isRequirementLinkConflict } from '../domain/rules/requirement-link.rules'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import {
  invalidateSpecPackEntityCache,
  invalidateSpecPackPreviewCache,
} from '@/modules/projects/requirements/model/spec-pack-preview.cache'

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
  const [approvedOnly, setApprovedOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [hideLinked, setHideLinked] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [focusDescription, setFocusDescription] = useState<string | null>(null)

  const loadCoversLinks = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLinksLoading(true)
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
      if (!opts?.silent) setLinksLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadCoversLinks()
  }, [loadCoversLinks])

  const filteredRequirements = useMemo(() => {
    const q = reqQuery.trim().toLowerCase()
    return requirements.filter((r) => {
      if (
        approvedOnly &&
        normalizeRequirementStatus(r.status) !== RequirementStatus.Approved
      ) {
        return false
      }
      if (!q) return true
      return [r.code, r.title, r.description]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [requirements, reqQuery, approvedOnly])

  useEffect(() => {
    if (focusReqId && !filteredRequirements.some((r) => r.id === focusReqId)) {
      setFocusReqId(filteredRequirements[0]?.id ?? null)
    } else if (!focusReqId && filteredRequirements[0]?.id) {
      setFocusReqId(filteredRequirements[0].id)
    }
  }, [filteredRequirements, focusReqId])

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
  const focusLinksLocked = focusReq ? !canMutateRequirementLinks(focusReq.status) : false

  useEffect(() => {
    if (!focusReq) {
      setFocusDescription(null)
      return
    }
    setFocusDescription(focusReq.description ?? null)
    let cancelled = false
    void getRequirement(workspaceId, projectId, focusReq.id)
      .then((full) => {
        if (cancelled) return
        if (full.description != null) setFocusDescription(full.description)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [workspaceId, projectId, focusReq?.id, focusReq?.description])

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
        frCode: fr?.code ?? link.targetCode ?? '—',
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
        frCode: fr?.code ?? '—',
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
      const focus = requirements.find((r) => r.id === focusReqId)
      if (focus && !canMutateRequirementLinks(focus.status)) {
        setFormError(RequirementImmutableMessages.LINK_LOCKED)
        return
      }
      setAssigning(true)
      setFormError(null)
      try {
        const toCreate = payloads.filter((p) => !linkedFrIdsForFocus.has(p.functionalItemId))
        if (toCreate.length === 0) return

        // BE preferred: junction API first, then COVERS trace link (idempotent on conflict).
        for (const p of toCreate) {
          try {
            await useCaseApi.linkRequirementToFunction(projectId, p.functionalItemId, {
              requirementId: focusReqId,
            })
          } catch (err: unknown) {
            if (!isRequirementLinkConflict(err)) throw err
          }

          try {
            await traceApi.createTraceLink(projectId, {
              sourceType: SOURCE_REQUIREMENT,
              sourceId: focusReqId,
              targetType: TARGET_FUNCTIONAL_ITEM,
              targetId: p.functionalItemId,
              linkType: TraceLinkType.Covers,
            })
          } catch (err: unknown) {
            if (!isRequirementLinkConflict(err)) throw err
          }
        }

        // Legacy FK pointer — only when still empty locally (junction may have set it on BE).
        if (focus && !focus.functionalItemId?.trim() && toCreate[0]) {
          try {
            await updateRequirement(focusReqId, {
              functionalItemId: toCreate[0].functionalItemId,
            })
          } catch (err: unknown) {
            if (!isRequirementLinkConflict(err)) throw err
          }
        }

        await Promise.all([
          loadCoversLinks({ silent: true }),
          refetchRequirements(),
        ])
        // Spec Pack preview caches trace indices; invalidate to reflect the latest links immediately.
        invalidateSpecPackPreviewCache()
        invalidateSpecPackEntityCache(projectId)
        setSelected(new Set())
        setBulkOpen(false)
      } catch (err: unknown) {
        setFormError(getProblemToastMessage(err))
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
      loadCoversLinks,
      refetchRequirements,
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
      const req = requirements.find((r) => r.id === edge.requirementId)
      if (req && !canMutateRequirementLinks(req.status)) {
        setFormError(RequirementImmutableMessages.LINK_LOCKED)
        return
      }
      try {
        // 1) Archive COVERS trace link when present (BE must preserve @Version on save).
        if (edge.linkId) {
          await traceApi.deleteTraceLink(projectId, edge.linkId)
        }
        // 2) Drop junction + clear/repoint requirement.functionalItemId on BE.
        //    Do not PATCH functionalItemId:null — BE update() treats null as "keep".
        await useCaseApi.unlinkRequirementFromFunction(
          projectId,
          edge.functionalItemId,
          edge.requirementId
        )
        await Promise.all([
          loadCoversLinks({ silent: true }),
          refetchRequirements(),
        ])
        // Spec Pack preview caches trace indices; invalidate to reflect the latest links immediately.
        invalidateSpecPackPreviewCache()
        invalidateSpecPackEntityCache(projectId)
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Failed to unlink')
      }
    },
    [projectId, requirements, loadCoversLinks, refetchRequirements]
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
              prefix={<Search size={14} />}
            />
            <Checkbox
              size="sm"
              checked={approvedOnly}
              onChange={(e) => setApprovedOnly(e.target.checked)}
              label="Approved only"
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
                  const locked = !canMutateRequirementLinks(item.status)
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
                          {locked ? ' · Locked' : ''}
                        </div>
                        <div
                          className={cn(
                            'truncate text-xs',
                            active ? 'text-white/60' : 'text-neutral-400'
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
              linksLocked={focusLinksLocked}
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
              description={focusDescription}
              linksLocked={focusLinksLocked}
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
            disabled: assigning || selectedPayloads.length === 0 || focusLinksLocked,
            loading: assigning,
            onClick: () => {
              void assignMany(selectedPayloads)
            },
          },
        ]}
      >
        {focusLinksLocked ? (
          <Typography variant="small" tone="error" className="mb-2">
            {RequirementImmutableMessages.LINK_LOCKED}
          </Typography>
        ) : null}
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
  linksLocked,
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
  linksLocked: boolean
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
        {linksLocked ? (
          <Typography variant="small" tone="error">
            {RequirementImmutableMessages.LINK_LOCKED}
          </Typography>
        ) : (
          <Typography variant="small" tone="muted">
            Showing functions for {focusReq.code}. Drag onto the drop zone or use Assign.
          </Typography>
        )}
        <Input
          fullWidth
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search…"
          aria-label="Search functions"
          prefix={<Search size={14} />}
          disabled={linksLocked}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 bg-neutral-50 px-2.5 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
            <Checkbox
              size="sm"
              checked={hideLinked}
              onChange={(e) => onHideLinkedChange(e.target.checked)}
              aria-label="Hide already assigned items"
              disabled={linksLocked}
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
        {!linksLocked && selectedPayloads.length > 0 ? (
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
        {linksLocked ? (
          <Typography variant="small" tone="muted" className="p-2">
            Linking is disabled for this requirement.
          </Typography>
        ) : loading && candidates.length === 0 ? (
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
  description,
  linksLocked,
  linked,
  assigning,
  onAssignMany,
  onUnlink,
}: {
  focusReq: Requirement
  description: string | null
  linksLocked: boolean
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
        <Typography weight="medium" size="sm" className="[overflow-wrap:anywhere]">
          {focusReq.code}
        </Typography>
        <Typography
          variant="small"
          className="mt-0.5 text-neutral-800 [overflow-wrap:anywhere]"
        >
          {focusReq.title}
        </Typography>
        {linksLocked ? (
          <Typography variant="caption" tone="error" className="mt-1 block">
            {RequirementImmutableMessages.LINK_LOCKED}
          </Typography>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3 border-b border-neutral-100 p-3">
          <div>
            <Typography
              variant="caption"
              tone="muted"
              className="mb-1 block uppercase tracking-wide"
            >
              Description
            </Typography>
            {description?.trim() ? (
              <Typography
                size="sm"
                className="whitespace-pre-wrap text-neutral-900 [overflow-wrap:anywhere]"
              >
                {description}
              </Typography>
            ) : (
              <Typography variant="small" tone="muted">
                No description.
              </Typography>
            )}
          </div>
        </div>

        <div className="space-y-2 p-3">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              if (linksLocked) {
                e.dataTransfer.dropEffect = 'none'
                setActiveDrop(false)
                setPreview('Linking locked for archived requirements')
                return
              }
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
              setActiveFrDrag(null)
              if (linksLocked) return
              const payloads = resolveBulk(e)
              if (!payloads.length) return
              void onAssignMany(payloads)
            }}
            className={cn(
              'min-h-[72px] border border-dashed p-3 transition-colors',
              linksLocked
                ? 'border-neutral-200 bg-neutral-50'
                : activeDrop
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
              {linksLocked
                ? 'Drop zone disabled while this requirement is immutable'
                : activeDrop && preview
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
                    <div className="text-sm text-neutral-900 [overflow-wrap:anywhere]">
                      {edge.frCode}
                    </div>
                    <div className="text-xs text-neutral-500 [overflow-wrap:anywhere]">
                      {edge.frTitle}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={linksLocked}
                    onClick={() => void onUnlink(edge)}
                  >
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
