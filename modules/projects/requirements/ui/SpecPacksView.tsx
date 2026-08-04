'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileDown, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, ContentLoader, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { exportSpecPackToDoc } from '../export/spec-pack-doc'
import { useSpecPackPreview } from '../hooks/useSpecPackPreview'
import { useSpecPacks } from '../hooks/useSpecPacks'
import type { Requirement } from '../model/requirements'
import { reorderSpecPackChapters } from '../model/reorder-spec-pack-chapters'
import {
  SpecPackStatus,
  formatSpecPackDate,
  type SpecPack,
} from '../model/spec-pack'
import type { SpecPackPreviewDocument } from '../model/spec-pack-preview'
import {
  invalidateSpecPackPreviewCache,
  setCachedSpecPackPreview,
} from '../model/spec-pack-preview.cache'
import { SpecPackChapterOutline } from './SpecPackChapterOutline'
import { SpecPackCreateModal } from './SpecPackCreateModal'
import { SpecPackPreviewPanel } from './SpecPackPreviewPanel'

interface SpecPacksViewProps {
  workspaceId: string
  projectId: string
  requirements: Requirement[]
  canCreate?: boolean
}

const REORDER_DEBOUNCE_MS = 400

function statusTone(status: SpecPack['status']): 'neutral' | 'success' | 'info' | 'default' {
  if (status === SpecPackStatus.Exported) return 'success'
  if (status === SpecPackStatus.Ready) return 'info'
  return 'default'
}

export function SpecPacksView({
  workspaceId,
  projectId,
  requirements,
  canCreate = true,
}: SpecPacksViewProps) {
  const { packs, createPack, markExported, removePack, reorderRequirements } = useSpecPacks(
    workspaceId,
    projectId
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [optimisticDoc, setOptimisticDoc] = useState<SpecPackPreviewDocument | null>(null)
  const [outlineFocusId, setOutlineFocusId] = useState<string | null>(null)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingOrderRef = useRef<string[] | null>(null)

  const selected = useMemo(
    () => packs.find((p) => p.id === selectedId) ?? packs[0] ?? null,
    [packs, selectedId]
  )

  const { document, loading, refreshing, error, hardRefresh } = useSpecPackPreview(
    workspaceId,
    selected
  )

  // Drop optimistic overlay once the hook document matches the pending order (or pack changes).
  useEffect(() => {
    setOptimisticDoc(null)
    pendingOrderRef.current = null
    if (persistTimer.current) {
      clearTimeout(persistTimer.current)
      persistTimer.current = null
    }
    setOutlineFocusId(selected?.requirements[0]?.id ?? null)
  }, [selected?.id])

  useEffect(() => {
    if (!optimisticDoc || !document || !pendingOrderRef.current) return
    const pending = pendingOrderRef.current
    const current = document.chapters.map((c) => c.requirement.id)
    if (
      pending.length === current.length &&
      pending.every((id, i) => id === current[i])
    ) {
      setOptimisticDoc(null)
      pendingOrderRef.current = null
    }
  }, [document, optimisticDoc])

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [])

  const displayDoc = optimisticDoc ?? document

  const outlineItems = useMemo(() => {
    if (displayDoc) {
      return displayDoc.chapters.map((c) => ({
        id: c.requirement.id,
        code: c.requirement.code,
        title: c.requirement.title,
      }))
    }
    return (
      selected?.requirements.map((r) => ({
        id: r.id,
        code: r.code,
        title: r.title,
      })) ?? []
    )
  }, [displayDoc, selected])

  const handleChapterReorder = useCallback(
    (orderedIds: string[]) => {
      if (!selected) return
      pendingOrderRef.current = orderedIds

      const base = optimisticDoc ?? document
      const nextDoc = base ? reorderSpecPackChapters(base, orderedIds) : null
      if (nextDoc) setOptimisticDoc(nextDoc)

      if (persistTimer.current) clearTimeout(persistTimer.current)
      const packId = selected.id
      persistTimer.current = setTimeout(() => {
        const updated = reorderRequirements(packId, orderedIds)
        if (!updated || !nextDoc) return
        setCachedSpecPackPreview(updated, nextDoc)
      }, REORDER_DEBOUNCE_MS)
    },
    [selected, optimisticDoc, document, reorderRequirements]
  )

  const handleExport = () => {
    if (!displayDoc || !selected) return
    setExporting(true)
    try {
      const { filename } = exportSpecPackToDoc(displayDoc)
      invalidateSpecPackPreviewCache(selected.id)
      markExported(selected.id)
      toast.success(`Exported ${filename}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden border border-neutral-300 bg-white lg:flex-row">
      <aside className="flex max-h-[220px] w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 lg:max-h-none lg:h-auto lg:w-[280px] lg:self-stretch lg:border-b-0 lg:border-r">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2.5">
          <div>
            <Typography variant="small" weight="medium">
              Spec Packs
            </Typography>
            <Typography variant="small" tone="muted">
              Request history
            </Typography>
          </div>
          {canCreate ? (
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)} className="bg-neutral-800">
              New
            </Button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {packs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <Typography weight="medium">No packs yet</Typography>
              <Typography variant="small" tone="muted" className="mt-1 max-w-[220px]">
                Bundle requirements into a Spec Pack, set reading order, then export to DOC.
              </Typography>
              {canCreate ? (
                <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                  Create Spec Pack
                </Button>
              ) : null}
            </div>
          ) : (
            <ul>
              {packs.map((pack) => {
                const active = selected?.id === pack.id
                return (
                  <li key={pack.id} className="border-b border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setSelectedId(pack.id)}
                      className={cn(
                        'w-full px-3 py-3 text-left transition-colors',
                        active ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-medium text-neutral-900">
                          {pack.title}
                        </span>
                        <Badge
                          size="sm"
                          variant="solid"
                          tone={statusTone(pack.status)}
                          className="shrink-0 border-0 text-white"
                        >
                          {pack.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {pack.requirements.length} req · {formatSpecPackDate(pack.createdAt)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-neutral-400">
                        {pack.requirements.map((r) => r.code).join(', ')}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>

      {selected ? (
        <aside className="flex max-h-[200px] w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 lg:max-h-none lg:h-auto lg:w-[240px] lg:self-stretch lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
            <Typography variant="small" weight="medium">
              Reading order
            </Typography>
            <Typography variant="caption" tone="muted">
              Drag to reorder · updates preview live
            </Typography>
          </div>
          <SpecPackChapterOutline
            items={outlineItems}
            activeId={outlineFocusId}
            onSelect={setOutlineFocusId}
            onReorder={handleChapterReorder}
          />
        </aside>
      ) : null}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {!selected ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <Typography tone="muted">Select a Spec Pack to preview.</Typography>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-2.5">
              <div className="min-w-0">
                <Typography weight="medium" className="truncate">
                  Preview
                  {refreshing ? (
                    <span className="ml-2 text-xs font-normal text-neutral-400">Updating…</span>
                  ) : null}
                </Typography>
                <Typography variant="small" tone="muted">
                  Exact DOC layout (WYSIWYG)
                </Typography>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RefreshCw size={14} className={cn(refreshing && 'animate-spin')} />}
                  disabled={loading || refreshing}
                  onClick={() => {
                    setOptimisticDoc(null)
                    void hardRefresh()
                  }}
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Trash2 size={14} />}
                  onClick={() => {
                    invalidateSpecPackPreviewCache(selected.id)
                    removePack(selected.id)
                    setSelectedId(null)
                    toast.success('Pack removed')
                  }}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  icon={<FileDown size={14} />}
                  disabled={!displayDoc || loading || exporting}
                  onClick={handleExport}
                >
                  Export DOC
                </Button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 bg-neutral-100">
              {loading && !displayDoc ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ContentLoader />
                </div>
              ) : error && !displayDoc ? (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <Typography tone="error">{error}</Typography>
                </div>
              ) : displayDoc ? (
                <div className="absolute inset-3 lg:inset-4">
                  <div className="mx-auto h-full w-full max-w-[816px]">
                    <SpecPackPreviewPanel document={displayDoc} />
                  </div>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>

      <SpecPackCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        requirements={requirements}
        onCreate={(input) => {
          const pack = createPack(input)
          setSelectedId(pack.id)
          toast.success('Spec Pack created')
        }}
      />
    </div>
  )
}
