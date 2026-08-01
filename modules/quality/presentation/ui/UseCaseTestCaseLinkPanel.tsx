'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Checkbox, Input, Modal, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useUseCaseCatalog, type UseCase } from '@/modules/projects/traceability'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { TestCase } from '../../domain/model/quality'

const TC_ASSIGN_MIME = 'application/x-scopery-tc-to-uc-assign'
const TC_ASSIGN_BULK_MIME = 'application/x-scopery-tc-to-uc-assign-bulk'

interface TcDragPayload {
  testCaseId: string
  code: string
  title: string
}

let activeDrag: TcDragPayload | null = null
const dragListeners = new Set<() => void>()

function setActiveTcDrag(payload: TcDragPayload | null) {
  activeDrag = payload
  dragListeners.forEach((l) => l())
}

function getActiveTcDrag(): TcDragPayload | null {
  return activeDrag
}

function subscribeActiveTcDrag(listener: () => void): () => void {
  dragListeners.add(listener)
  return () => {
    dragListeners.delete(listener)
  }
}

function encodeTcDrag(payload: TcDragPayload): string {
  return JSON.stringify(payload)
}

function decodeTcDrag(raw: string): TcDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as TcDragPayload
    if (!parsed?.testCaseId) return null
    return parsed
  } catch {
    return null
  }
}

interface UseCaseTestCaseLinkPanelProps {
  projectId: string
  initialUseCaseId?: string | null
  /** When set, hide the Use Case picker and lock linking to this Use Case. */
  lockedUseCaseId?: string | null
}

export function UseCaseTestCaseLinkPanel({
  projectId,
  initialUseCaseId,
  lockedUseCaseId,
}: UseCaseTestCaseLinkPanelProps) {
  const { useCases } = useUseCaseCatalog(projectId)
  const [useCaseId, setUseCaseId] = useState(lockedUseCaseId ?? initialUseCaseId ?? '')
  const seededInitialRef = useRef(initialUseCaseId ?? null)
  const [useCaseQuery, setUseCaseQuery] = useState('')
  const [testCaseQuery, setTestCaseQuery] = useState('')
  const [hideLinked, setHideLinked] = useState(true)
  const [allTestCases, setAllTestCases] = useState<TestCase[]>([])
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Lock wins; deep-link seeds only when URL useCaseId changes — never fight sidebar focus.
  useEffect(() => {
    if (lockedUseCaseId) {
      setUseCaseId(lockedUseCaseId)
      return
    }
    if (initialUseCaseId && seededInitialRef.current !== initialUseCaseId) {
      seededInitialRef.current = initialUseCaseId
      setUseCaseId(initialUseCaseId)
      return
    }
    if (useCaseId || useCases.length === 0) return
    setUseCaseId(useCases[0]?.id ?? '')
  }, [initialUseCaseId, lockedUseCaseId, useCaseId, useCases])

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!projectId) return
    if (!opts?.silent) setLoading(true)
    setFormError(null)
    try {
      const all = await qualityApi.listTestCases(projectId, {
        page: 0,
        size: 500,
        sort: 'updatedAt,desc',
      })
      const byId = new Map(all.items.map((item) => [item.id, item]))
      const nextLinked = new Set<string>()

      for (const item of all.items) {
        if (useCaseId && item.useCaseId === useCaseId) {
          nextLinked.add(item.id)
        }
      }

      if (useCaseId) {
        const byFk = await qualityApi.listTestCases(projectId, {
          useCaseId,
          page: 0,
          size: 500,
          sort: 'updatedAt,desc',
        })
        for (const item of byFk.items) {
          byId.set(item.id, item)
          nextLinked.add(item.id)
        }
      }

      setAllTestCases([...byId.values()])
      setLinkedIds(nextLinked)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to load Test Cases')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [projectId, useCaseId])

  useEffect(() => {
    setSelectedIds(new Set())
    setTestCaseQuery('')
    setPreviewId(null)
    setFormError(null)
    void load()
  }, [load])

  const focusUseCase = useMemo(
    () => useCases.find((item) => item.id === useCaseId) ?? null,
    [useCaseId, useCases]
  )

  const filteredUseCases = useMemo(() => {
    const query = useCaseQuery.trim().toLowerCase()
    if (!query) return useCases
    return useCases.filter((item) =>
      `${item.key} ${item.name} ${item.primaryFunctionName ?? ''}`.toLowerCase().includes(query)
    )
  }, [useCaseQuery, useCases])

  const linkCountByUc = useMemo(() => {
    const map = new Map<string, number>()
    for (const tc of allTestCases) {
      if (!tc.useCaseId) continue
      map.set(tc.useCaseId, (map.get(tc.useCaseId) ?? 0) + 1)
    }
    if (useCaseId) map.set(useCaseId, linkedIds.size)
    return map
  }, [allTestCases, linkedIds, useCaseId])

  const candidates = useMemo(() => {
    const query = testCaseQuery.trim().toLowerCase()
    return allTestCases.filter((item) => {
      const linkedHere = linkedIds.has(item.id)
      if (hideLinked && linkedHere) return false
      if (!query) return true
      return `${item.code ?? ''} ${item.title}`.toLowerCase().includes(query)
    })
  }, [allTestCases, hideLinked, linkedIds, testCaseQuery])

  const linked = useMemo(
    () => allTestCases.filter((item) => linkedIds.has(item.id)),
    [allTestCases, linkedIds]
  )

  const selectedPayloads = useMemo(() => {
    const out: TcDragPayload[] = []
    for (const item of candidates) {
      if (!selectedIds.has(item.id)) continue
      if (linkedIds.has(item.id)) continue
      out.push({
        testCaseId: item.id,
        code: item.code ?? 'Draft',
        title: item.title,
      })
    }
    return out
  }, [candidates, selectedIds, linkedIds])

  const toggleSelect = (id: string, disabled?: boolean) => {
    if (disabled) return
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resolveCurrentUseCaseIds = async (testCaseId: string): Promise<string[]> => {
    try {
      const traceability = await qualityApi.getTestCaseTraceability(projectId, testCaseId)
      const ids = traceability.useCases.map((item) => item.id)
      if (ids.length > 0) return ids
    } catch {
      // Fall through to FK on the catalog row / detail
    }
    const fromList = allTestCases.find((item) => item.id === testCaseId)?.useCaseId
    if (fromList) return [fromList]
    try {
      const detail = await qualityApi.getTestCase(projectId, testCaseId)
      return detail.useCaseId ? [detail.useCaseId] : []
    } catch {
      return []
    }
  }

  const syncPrimaryUseCaseFk = async (testCaseId: string, nextUseCaseId: string | null) => {
    const detail = await qualityApi.getTestCase(projectId, testCaseId)
    // BE list filter uses use_case_id FK; coverage links alone will not show on this page.
    await qualityApi.updateTestCase(projectId, testCaseId, {
      useCaseId: nextUseCaseId,
      version: detail.version ?? 0,
    })
  }

  const applyLocalLinkState = (testCaseIds: string[], nextUseCaseId: string | null) => {
    const idSet = new Set(testCaseIds)
    setLinkedIds((prev) => {
      const next = new Set(prev)
      for (const id of idSet) {
        if (nextUseCaseId) next.add(id)
        else next.delete(id)
      }
      return next
    })
    setAllTestCases((prev) =>
      prev.map((tc) =>
        idSet.has(tc.id)
          ? {
              ...tc,
              useCaseId: nextUseCaseId,
              useCaseCount: nextUseCaseId
                ? Math.max(1, (tc.useCaseCount ?? 0) + (tc.useCaseId === nextUseCaseId ? 0 : 1))
                : Math.max(0, (tc.useCaseCount ?? 1) - 1),
            }
          : tc
      )
    )
  }

  const assignMany = useCallback(
    async (payloads: TcDragPayload[]) => {
      if (!useCaseId || payloads.length === 0) return
      const toLink = payloads.filter((p) => !linkedIds.has(p.testCaseId))
      if (toLink.length === 0) return
      setSaving(true)
      setFormError(null)
      try {
        const linkedNow: string[] = []
        for (const payload of toLink) {
          const currentIds = await resolveCurrentUseCaseIds(payload.testCaseId)
          const nextIds = [...new Set([...currentIds, useCaseId])]

          // Coverage (M2M) — best effort
          try {
            await qualityApi.replaceTestCaseUseCaseLinks(projectId, payload.testCaseId, nextIds)
          } catch {
            // Continue — FK sync below is what makes this page show the link
          }

          // Primary FK — required for list(?useCaseId=) and this panel's linked list
          await syncPrimaryUseCaseFk(payload.testCaseId, useCaseId)
          linkedNow.push(payload.testCaseId)
        }

        applyLocalLinkState(linkedNow, useCaseId)
        toast.success(`${linkedNow.length} Test Case${linkedNow.length === 1 ? '' : 's'} linked`)
        setSelectedIds(new Set())
        setBulkOpen(false)
        await load({ silent: true })
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to assign')
        toast.error(err instanceof Error ? err.message : 'Failed to assign')
      } finally {
        setSaving(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTestCases, linkedIds, load, projectId, useCaseId]
  )

  const unlink = async (testCaseId: string) => {
    if (!useCaseId) return
    setSaving(true)
    setFormError(null)
    try {
      const currentIds = await resolveCurrentUseCaseIds(testCaseId)
      const nextIds = currentIds.filter((id) => id !== useCaseId)

      try {
        await qualityApi.replaceTestCaseUseCaseLinks(projectId, testCaseId, nextIds)
      } catch {
        // Fall through to FK clear / reassign
      }

      // Prefer remaining coverage UC as FK; otherwise clear display by pointing away.
      // (BE update ignores null useCaseId — keep a remaining id when possible.)
      const nextPrimary = nextIds[0] ?? null
      if (nextPrimary) {
        await syncPrimaryUseCaseFk(testCaseId, nextPrimary)
      } else {
        // Try clear; if BE ignores null, local state still removes from this UC list.
        try {
          await syncPrimaryUseCaseFk(testCaseId, null)
        } catch {
          /* ignore */
        }
      }

      applyLocalLinkState([testCaseId], null)
      toast.success('Use Case link removed')
      await load({ silent: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to unlink')
      toast.error(err instanceof Error ? err.message : 'Failed to unlink')
    } finally {
      setSaving(false)
    }
  }

  const showUseCasePicker = !lockedUseCaseId
  const ucWithoutTc = useCases.filter((uc) => (linkCountByUc.get(uc.id) ?? 0) === 0).length

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
        <div>
          <Typography weight="medium" size="sm">
            Use Case to Test Case
          </Typography>
          <Typography variant="small" tone="muted">
            {showUseCasePicker
              ? 'Select a Use Case, then drag Test Cases onto it.'
              : 'Drag Test Cases onto this Use Case or use Assign.'}{' '}
            {linked.length} link{linked.length === 1 ? '' : 's'}
            {showUseCasePicker && ucWithoutTc
              ? ` · ${ucWithoutTc} Use Case with no Test Case`
              : ''}
          </Typography>
        </div>
      </div>

      {formError ? (
        <Typography tone="error" variant="small" className="px-3 py-2">
          {formError}
        </Typography>
      ) : null}

      <div
        className={cn(
          'grid min-h-0 flex-1 overflow-hidden',
          showUseCasePicker
            ? 'grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]'
            : 'grid-cols-1'
        )}
      >
        {showUseCasePicker ? (
          <aside className="flex min-h-0 flex-col overflow-hidden border-b border-neutral-200 lg:border-b-0 lg:border-r">
            <div className="shrink-0 space-y-2 border-b border-neutral-100 px-3 py-2">
              <Typography
                variant="caption"
                tone="muted"
                className="block text-[10px] uppercase tracking-wide"
              >
                Use Cases
              </Typography>
              <Input
                fullWidth
                value={useCaseQuery}
                onChange={(e) => setUseCaseQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search Use Cases"
                prefix={<Search size={14} />}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {useCases.length === 0 ? (
                <Typography variant="small" tone="muted" className="px-3 py-2">
                  No Use Cases in this project.
                </Typography>
              ) : filteredUseCases.length === 0 ? (
                <Typography variant="small" tone="muted" className="px-3 py-2">
                  No Use Cases match this search.
                </Typography>
              ) : (
                <ul className="space-y-0.5 px-1 pb-2">
                  {filteredUseCases.map((item) => {
                    const count = linkCountByUc.get(item.id) ?? 0
                    const active = useCaseId === item.id
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setUseCaseId(item.id)}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm',
                            active
                              ? 'bg-secondary text-white'
                              : 'text-neutral-900 hover:bg-neutral-100'
                          )}
                        >
                          <div className="truncate font-medium">{item.key}</div>
                          <div
                            className={cn(
                              'truncate text-xs',
                              active ? 'text-white/75' : 'text-neutral-500'
                            )}
                          >
                            {item.name}
                          </div>
                          <div
                            className={cn(
                              'truncate text-xs',
                              active ? 'text-white/60' : 'text-neutral-400'
                            )}
                          >
                            {count === 0
                              ? 'Not linked'
                              : `${count} Test Case${count === 1 ? '' : 's'}`}
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </aside>
        ) : null}

        {!focusUseCase ? (
          <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
            <Typography weight="medium">Assignment dock</Typography>
            <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
              Select a Use Case to open available Test Cases next to the drop zone.
            </Typography>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-[minmax(280px,1.15fr)_minmax(0,0.85fr)]">
            <TestCaseCandidatePalette
              focusUseCase={focusUseCase}
              candidates={candidates}
              allTestCases={allTestCases}
              loading={loading}
              hideLinked={hideLinked}
              linkedHereCount={linked.length}
              linkedIds={linkedIds}
              selected={selectedIds}
              selectedPayloads={selectedPayloads}
              previewId={previewId}
              query={testCaseQuery}
              saving={saving}
              onHideLinkedChange={setHideLinked}
              onQueryChange={setTestCaseQuery}
              onPreview={setPreviewId}
              onToggleSelect={toggleSelect}
              onAssign={(payload) => void assignMany([payload])}
              onOpenBulk={() => setBulkOpen(true)}
              onClearSelected={() => setSelectedIds(new Set())}
            />
            <UseCaseFocusInspector
              focusUseCase={focusUseCase}
              linked={linked}
              saving={saving}
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
            disabled: saving || selectedPayloads.length === 0,
            loading: saving,
            onClick: () => {
              void assignMany(selectedPayloads)
            },
          },
        ]}
      >
        <Typography variant="small" tone="muted" className="mb-2">
          Link {selectedPayloads.length} Test Case
          {selectedPayloads.length === 1 ? '' : 's'} to {focusUseCase?.key ?? 'Use Case'}.
        </Typography>
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {selectedPayloads.map((p) => (
            <li key={p.testCaseId} className="truncate text-neutral-900">
              {p.code} — {p.title}
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  )
}

function TestCaseCandidatePalette({
  focusUseCase,
  candidates,
  allTestCases,
  loading,
  hideLinked,
  linkedHereCount,
  linkedIds,
  selected,
  selectedPayloads,
  previewId,
  query,
  saving,
  onHideLinkedChange,
  onQueryChange,
  onPreview,
  onToggleSelect,
  onAssign,
  onOpenBulk,
  onClearSelected,
}: {
  focusUseCase: UseCase
  candidates: TestCase[]
  allTestCases: TestCase[]
  loading: boolean
  hideLinked: boolean
  linkedHereCount: number
  linkedIds: Set<string>
  selected: Set<string>
  selectedPayloads: TcDragPayload[]
  previewId: string | null
  query: string
  saving: boolean
  onHideLinkedChange: (v: boolean) => void
  onQueryChange: (v: string) => void
  onPreview: (id: string | null) => void
  onToggleSelect: (id: string, disabled?: boolean) => void
  onAssign: (payload: TcDragPayload) => void
  onOpenBulk: () => void
  onClearSelected: () => void
}) {
  const preview = allTestCases.find((i) => i.id === previewId) ?? null

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
      <div className="shrink-0 space-y-2 border-b border-neutral-100 p-3">
        <Typography weight="medium" size="sm">
          Available to assign
        </Typography>
        <Typography variant="small" tone="muted">
          Showing Test Cases for {focusUseCase.key}. Drag onto the drop zone or use Assign.
        </Typography>
        <Input
          fullWidth
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search…"
          aria-label="Search Test Cases"
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
            <Button size="sm" variant="secondary" disabled={saving} onClick={onOpenBulk}>
              Assign selected
            </Button>
            <Button size="sm" variant="ghost" onClick={onClearSelected}>
              Clear
            </Button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2" onMouseLeave={() => onPreview(null)}>
        {loading && candidates.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            Loading candidates…
          </Typography>
        ) : candidates.length === 0 ? (
          <Typography variant="small" tone="muted" className="p-2">
            {hideLinked
              ? 'No unassigned Test Cases. Click “Show assigned” to review linked items.'
              : 'No Test Cases match this search.'}
          </Typography>
        ) : (
          <ul className="space-y-0.5">
            {candidates.map((item) => {
              const linkedHere = linkedIds.has(item.id)
              const disabled = linkedHere
              const payload: TcDragPayload = {
                testCaseId: item.id,
                code: item.code ?? 'Draft',
                title: item.title,
              }
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
                          : [payload]
                      if (!payloads.length) {
                        e.preventDefault()
                        return
                      }
                      setActiveTcDrag(payloads[0])
                      e.dataTransfer.setData(TC_ASSIGN_MIME, encodeTcDrag(payloads[0]))
                      e.dataTransfer.setData(TC_ASSIGN_BULK_MIME, JSON.stringify(payloads))
                      e.dataTransfer.effectAllowed = 'link'
                    }}
                    onDragEnd={() => setActiveTcDrag(null)}
                    onClick={(e) => {
                      if (disabled) return
                      // Checkbox / Assign handle their own clicks
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
                        onClick={(e) => e.stopPropagation()}
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
                        {item.code ?? 'Draft'}
                        {linkedHere ? ' · Already linked' : ''}
                      </div>
                    </div>
                    {disabled ? null : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => onAssign(payload)}
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
              <span className="ml-1 font-normal text-neutral-500">
                ({preview.code ?? 'Draft'})
              </span>
            </div>
            <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-neutral-600">
              {preview.description?.trim() || preview.status || 'No description'}
            </p>
          </>
        ) : (
          <Typography variant="small" tone="muted">
            Hover a Test Case for details. Drag onto the drop zone to link.
          </Typography>
        )}
      </div>
    </div>
  )
}

function UseCaseFocusInspector({
  focusUseCase,
  linked,
  saving,
  onAssignMany,
  onUnlink,
}: {
  focusUseCase: UseCase
  linked: TestCase[]
  saving: boolean
  onAssignMany: (payloads: TcDragPayload[]) => void
  onUnlink: (testCaseId: string) => void
}) {
  const [activeDrop, setActiveDrop] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragPayload, setDragPayload] = useState<TcDragPayload | null>(null)

  useEffect(() => subscribeActiveTcDrag(() => setDragPayload(getActiveTcDrag())), [])

  const resolvePayload = (e: React.DragEvent): TcDragPayload | null => {
    return getActiveTcDrag() || decodeTcDrag(e.dataTransfer.getData(TC_ASSIGN_MIME))
  }

  const resolveBulk = (e: React.DragEvent): TcDragPayload[] => {
    try {
      const raw = e.dataTransfer.getData(TC_ASSIGN_BULK_MIME)
      if (raw) {
        const parsed = JSON.parse(raw) as TcDragPayload[]
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
          {focusUseCase.key}
        </Typography>
        <Typography variant="small" tone="muted" className="truncate">
          Use Case · {focusUseCase.name}
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
                setPreview(`Link ${payload.code} → ${focusUseCase.key}`)
              } else {
                e.dataTransfer.dropEffect = 'link'
                setPreview('Drop Test Cases here')
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
              setActiveTcDrag(null)
              if (!payloads.length) return
              void onAssignMany(payloads)
            }}
            className={cn(
              'min-h-[72px] border border-dashed p-3 transition-colors',
              activeDrop ? 'border-secondary bg-secondary/10' : 'border-secondary/30 bg-white'
            )}
          >
            <Typography
              variant="small"
              className="text-xs font-medium uppercase tracking-wide text-neutral-900"
            >
              Test Cases
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {activeDrop && preview
                ? preview
                : 'Drop Test Cases here to link them to this Use Case'}
            </Typography>
          </div>
          {saving ? (
            <Typography variant="small" tone="muted">
              Assigning…
            </Typography>
          ) : null}
        </div>

        <div className="border-t border-neutral-100 px-3 py-3">
          <Typography variant="small" tone="muted" className="mb-2 block">
            Linked Test Cases ({linked.length})
          </Typography>
          {linked.length === 0 ? (
            <Typography variant="small" tone="muted">
              None yet. Drag from Available to assign, or click Assign.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {linked.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-neutral-900">
                      {item.code ?? 'Draft'}
                    </div>
                    <div className="truncate text-xs text-neutral-500">{item.title}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="error"
                    disabled={saving}
                    onClick={() => void onUnlink(item.id)}
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
