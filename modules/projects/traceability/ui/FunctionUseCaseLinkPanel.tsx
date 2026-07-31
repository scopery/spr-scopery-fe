'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Checkbox, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { FunctionalItem } from '../model/functional-catalog'
import type { UseCase } from '../model/use-case'
import * as useCaseApi from '../api/use-case.api'

const UC_ASSIGN_MIME = 'application/x-scopery-uc-to-fn-assign'
const UC_ASSIGN_BULK_MIME = 'application/x-scopery-uc-to-fn-assign-bulk'

interface UcDragPayload {
  useCaseId: string
  key: string
  name: string
}

let activeDrag: UcDragPayload | null = null
const dragListeners = new Set<() => void>()

function setActiveUcDrag(payload: UcDragPayload | null) {
  activeDrag = payload
  dragListeners.forEach((l) => l())
}

function getActiveUcDrag(): UcDragPayload | null {
  return activeDrag
}

function subscribeActiveUcDrag(listener: () => void): () => void {
  dragListeners.add(listener)
  return () => {
    dragListeners.delete(listener)
  }
}

function encodeUcDrag(payload: UcDragPayload): string {
  return JSON.stringify(payload)
}

function decodeUcDrag(raw: string): UcDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as UcDragPayload
    if (!parsed?.useCaseId) return null
    return parsed
  } catch {
    return null
  }
}

interface FunctionUseCaseLinkPanelProps {
  projectId: string
  functionalItems: FunctionalItem[]
  useCases: UseCase[]
  initialFunctionId?: string | null
  onChanged: () => Promise<void>
}

export function FunctionUseCaseLinkPanel({
  projectId,
  functionalItems,
  useCases,
  initialFunctionId,
  onChanged,
}: FunctionUseCaseLinkPanelProps) {
  const [functionId, setFunctionId] = useState(initialFunctionId ?? functionalItems[0]?.id ?? '')
  const [functionQuery, setFunctionQuery] = useState('')
  const [useCaseQuery, setUseCaseQuery] = useState('')
  const [hideLinked, setHideLinked] = useState(true)
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (functionId || functionalItems.length === 0) return
    setFunctionId(initialFunctionId ?? functionalItems[0]?.id ?? '')
  }, [functionId, functionalItems, initialFunctionId])

  const loadLinks = useCallback(async () => {
    if (!functionId) {
      setLinkedIds(new Set())
      return
    }
    setLoading(true)
    try {
      const linked = await useCaseApi.listUseCasesByFunction(projectId, functionId)
      setLinkedIds(new Set(linked.map((item) => item.id)))
    } finally {
      setLoading(false)
    }
  }, [functionId, projectId])

  useEffect(() => {
    setSelectedIds(new Set())
    setUseCaseQuery('')
    setPreviewId(null)
    void loadLinks()
  }, [loadLinks])

  const focusFunction = useMemo(
    () => functionalItems.find((item) => item.id === functionId) ?? null,
    [functionalItems, functionId]
  )

  const filteredFunctions = useMemo(() => {
    const query = functionQuery.trim().toLowerCase()
    if (!query) return functionalItems
    return functionalItems.filter((item) =>
      `${item.code} ${item.title}`.toLowerCase().includes(query)
    )
  }, [functionalItems, functionQuery])

  const candidates = useMemo(() => {
    const query = useCaseQuery.trim().toLowerCase()
    return useCases.filter((item) => {
      const linkedHere = linkedIds.has(item.id)
      if (hideLinked && linkedHere) return false
      if (!query) return true
      return `${item.key} ${item.name} ${item.primaryFunctionName}`
        .toLowerCase()
        .includes(query)
    })
  }, [hideLinked, linkedIds, useCaseQuery, useCases])

  const linked = useMemo(
    () => useCases.filter((item) => linkedIds.has(item.id)),
    [linkedIds, useCases]
  )

  const linkedHereCount = linked.length

  const selectedPayloads = useMemo(() => {
    const out: UcDragPayload[] = []
    for (const item of candidates) {
      if (!selectedIds.has(item.id)) continue
      if (linkedIds.has(item.id)) continue
      out.push({ useCaseId: item.id, key: item.key, name: item.name })
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

  const linkMany = useCallback(
    async (payloads: UcDragPayload[]) => {
      if (!functionId || payloads.length === 0) return
      const toLink = payloads.filter((p) => !linkedIds.has(p.useCaseId))
      if (toLink.length === 0) return
      setSaving(true)
      try {
        await Promise.all(
          toLink.map((payload) =>
            useCaseApi.addSupportingFunction(projectId, payload.useCaseId, { functionId })
          )
        )
        toast.success(`${toLink.length} Use Case${toLink.length === 1 ? '' : 's'} linked`)
        setSelectedIds(new Set())
        await Promise.all([loadLinks(), onChanged()])
      } finally {
        setSaving(false)
      }
    },
    [functionId, linkedIds, loadLinks, onChanged, projectId]
  )

  const unlink = async (useCase: UseCase) => {
    if (useCase.primaryFunctionId === functionId) return
    setSaving(true)
    try {
      await useCaseApi.removeSupportingFunction(projectId, useCase.id, functionId)
      toast.success('Supporting Function link removed')
      await Promise.all([loadLinks(), onChanged()])
    } finally {
      setSaving(false)
    }
  }

  const preview = useCases.find((item) => item.id === previewId) ?? null

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden border border-neutral-200 bg-white">
      <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
        <Typography weight="medium" size="sm">
          Function to Use Case
        </Typography>
        <Typography variant="small" tone="muted">
          Select a Function, then drag Use Cases onto the drop zone or assign them. {linked.length}{' '}
          linked to the selected Function.
        </Typography>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden border-b border-neutral-200 lg:border-b-0 lg:border-r">
          <div className="shrink-0 space-y-2 border-b border-neutral-100 px-3 py-2">
            <Typography
              variant="caption"
              tone="muted"
              className="block text-[10px] uppercase tracking-wide"
            >
              Functions
            </Typography>
            <Input
              fullWidth
              placeholder="Search Functions…"
              value={functionQuery}
              onChange={(event) => setFunctionQuery(event.target.value)}
              prefix={<Search size={14} />}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredFunctions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm',
                  functionId === item.id
                    ? 'bg-secondary text-white'
                    : 'text-neutral-900 hover:bg-neutral-100'
                )}
                onClick={() => setFunctionId(item.id)}
              >
                <div className="truncate font-medium">{item.title}</div>
                <div
                  className={cn(
                    'truncate text-xs',
                    functionId === item.id ? 'text-white/75' : 'text-neutral-500'
                  )}
                >
                  {item.code}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[minmax(280px,1.15fr)_minmax(0,0.85fr)]">
          <section className="flex min-h-0 flex-col overflow-hidden border-r border-neutral-200 bg-white">
            <div className="shrink-0 space-y-2 border-b border-neutral-100 p-3">
              <Typography weight="medium" size="sm">
                Available to assign
              </Typography>
              <Typography variant="small" tone="muted">
                {focusFunction
                  ? `Showing Use Cases for ${focusFunction.code}. Drag onto the drop zone or use Assign.`
                  : 'Select a Function first.'}
              </Typography>
              <Input
                fullWidth
                placeholder="Search available Use Cases…"
                value={useCaseQuery}
                onChange={(event) => setUseCaseQuery(event.target.value)}
                aria-label="Search Use Cases"
                prefix={<Search size={14} />}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 bg-neutral-50 px-2.5 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-700">
                  <Checkbox
                    size="sm"
                    checked={hideLinked}
                    onChange={(e) => setHideLinked(e.target.checked)}
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
                    onClick={() => setHideLinked(true)}
                  >
                    Hide them
                  </button>
                ) : linkedHereCount > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-neutral-500 underline hover:text-neutral-800"
                    onClick={() => setHideLinked(false)}
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
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={saving}
                    onClick={() => void linkMany(selectedPayloads)}
                  >
                    Assign selected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                    Clear
                  </Button>
                </div>
              ) : null}
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto p-2"
              onMouseLeave={() => setPreviewId(null)}
            >
              {!functionId ? (
                <Typography variant="small" tone="muted" className="p-2">
                  Select a Function to see assignable Use Cases.
                </Typography>
              ) : loading ? (
                <Typography variant="small" tone="muted" className="p-2">
                  Loading candidates…
                </Typography>
              ) : candidates.length === 0 ? (
                <Typography variant="small" tone="muted" className="p-2">
                  {hideLinked
                    ? 'No unassigned Use Cases. Click “Show assigned” to review linked items.'
                    : 'No Use Cases match this search.'}
                </Typography>
              ) : (
                <ul className="space-y-0.5">
                  {candidates.map((item) => {
                    const linkedHere = linkedIds.has(item.id)
                    const disabled = linkedHere
                    const payload: UcDragPayload = {
                      useCaseId: item.id,
                      key: item.key,
                      name: item.name,
                    }
                    return (
                      <li key={item.id}>
                        <div
                          draggable={!disabled}
                          onMouseEnter={() => setPreviewId(item.id)}
                          onFocus={() => setPreviewId(item.id)}
                          onDragStart={(e) => {
                            if (disabled) {
                              e.preventDefault()
                              return
                            }
                            const payloads =
                              selectedPayloads.length > 1 && selectedIds.has(item.id)
                                ? selectedPayloads
                                : [payload]
                            if (!payloads.length) {
                              e.preventDefault()
                              return
                            }
                            setActiveUcDrag(payloads[0])
                            e.dataTransfer.setData(UC_ASSIGN_MIME, encodeUcDrag(payloads[0]))
                            e.dataTransfer.setData(UC_ASSIGN_BULK_MIME, JSON.stringify(payloads))
                            e.dataTransfer.effectAllowed = 'link'
                          }}
                          onDragEnd={() => setActiveUcDrag(null)}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey) {
                              toggleSelect(item.id, disabled)
                            }
                          }}
                          className={cn(
                            'flex items-start gap-2 border border-transparent px-2.5 py-2',
                            disabled
                              ? 'opacity-60'
                              : 'cursor-grab hover:bg-secondary/5 active:cursor-grabbing',
                            selectedIds.has(item.id) && 'bg-secondary/10',
                            previewId === item.id && 'bg-neutral-50'
                          )}
                        >
                          {!disabled ? (
                            <Checkbox
                              size="sm"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              aria-label={`Select ${item.name}`}
                            />
                          ) : (
                            <span className="w-4" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-neutral-900">
                              {item.name}
                            </div>
                            <div className="truncate text-xs text-neutral-500">
                              {item.key}
                              {linkedHere ? ' · Already linked' : ''}
                              {!linkedHere && item.primaryFunctionName
                                ? ` · Primary: ${item.primaryFunctionName}`
                                : ''}
                            </div>
                          </div>
                          {disabled ? null : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={saving}
                              onClick={() => void linkMany([payload])}
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
                    {preview.name}
                    <span className="ml-1 font-normal text-neutral-500">({preview.key})</span>
                  </div>
                  <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-neutral-600">
                    {preview.primaryFunctionName
                      ? `Primary Function: ${preview.primaryFunctionName}`
                      : 'No primary Function yet'}
                  </p>
                </>
              ) : (
                <Typography variant="small" tone="muted">
                  Hover a Use Case for details. Drag onto the drop zone to link.
                </Typography>
              )}
            </div>
          </section>

          <FunctionFocusInspector
            focusFunction={focusFunction}
            linked={linked}
            saving={saving}
            onAssignMany={linkMany}
            onUnlink={unlink}
          />
        </div>
      </div>
    </div>
  )
}

function FunctionFocusInspector({
  focusFunction,
  linked,
  saving,
  onAssignMany,
  onUnlink,
}: {
  focusFunction: FunctionalItem | null
  linked: UseCase[]
  saving: boolean
  onAssignMany: (payloads: UcDragPayload[]) => void
  onUnlink: (useCase: UseCase) => void
}) {
  const [activeDrop, setActiveDrop] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragPayload, setDragPayload] = useState<UcDragPayload | null>(null)

  useEffect(() => subscribeActiveUcDrag(() => setDragPayload(getActiveUcDrag())), [])

  const resolvePayload = (e: React.DragEvent): UcDragPayload | null => {
    return getActiveUcDrag() || decodeUcDrag(e.dataTransfer.getData(UC_ASSIGN_MIME))
  }

  const resolveBulk = (e: React.DragEvent): UcDragPayload[] => {
    try {
      const raw = e.dataTransfer.getData(UC_ASSIGN_BULK_MIME)
      if (raw) {
        const parsed = JSON.parse(raw) as UcDragPayload[]
        if (Array.isArray(parsed) && parsed.length) return parsed
      }
    } catch {
      /* ignore */
    }
    const one = resolvePayload(e)
    return one ? [one] : []
  }

  if (!focusFunction) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-white px-6 text-center">
        <Typography weight="medium">Assignment dock</Typography>
        <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
          Select a Function to open available Use Cases next to the drop zone.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
        <Typography weight="medium" size="sm">
          {focusFunction.title}
        </Typography>
        <Typography variant="small" tone="muted" className="truncate">
          Function · {focusFunction.code}
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
                setPreview(`Link ${payload.key} → ${focusFunction.code}`)
              } else {
                e.dataTransfer.dropEffect = 'link'
                setPreview('Drop Use Cases here')
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
              setActiveUcDrag(null)
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
              Use Cases
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {activeDrop && preview
                ? preview
                : 'Drop Use Cases here to link them to this Function'}
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
            Linked Use Cases ({linked.length})
          </Typography>
          {linked.length === 0 ? (
            <Typography variant="small" tone="muted">
              None yet. Drag from Available to assign, or click Assign.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {linked.map((item) => {
                const primary = item.primaryFunctionId === focusFunction.id
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-900">
                        {item.name}
                      </div>
                      <div className="truncate text-xs text-neutral-500">
                        {item.key}
                        {primary ? ' · Primary Function' : ' · Supporting Function'}
                      </div>
                    </div>
                    {!primary ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        tone="error"
                        disabled={saving}
                        onClick={() => void onUnlink(item)}
                      >
                        Unlink
                      </Button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
