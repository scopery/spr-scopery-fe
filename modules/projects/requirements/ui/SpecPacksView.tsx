'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  FileDown,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  ContentLoader,
  Typography,
  anchoredMenuItemClassName,
} from '@/shared/ui'
import { cn } from '@/utils/cn'
import { exportSpecPackToDocx } from '../export/spec-pack-docx'
import { exportSpecPackToExcel } from '../export/spec-pack-excel'
import { useSpecPackPreview } from '../hooks/useSpecPackPreview'
import { useSpecPacks } from '../hooks/useSpecPacks'
import type { Requirement } from '../model/requirements'
import { applySpecPackGroupsToPreview } from '../model/reorder-spec-pack-chapters'
import {
  SpecPackStatus,
  flattenSpecPackRequirements,
  formatSpecPackDate,
  type SpecPack,
  type SpecPackGroup,
} from '../model/spec-pack'
import type { SpecPackPreviewDocument } from '../model/spec-pack-preview'
import {
  invalidateSpecPackPreviewCache,
  setCachedSpecPackPreview,
} from '../model/spec-pack-preview.cache'
import { SpecPackCreateModal } from './SpecPackCreateModal'
import { SpecPackGroupOutline } from './SpecPackGroupOutline'
import { SpecPackGroupsEditModal } from './SpecPackGroupsEditModal'
import { SpecPackPreviewPanel } from './SpecPackPreviewPanel'

interface SpecPacksViewProps {
  workspaceId: string
  projectId: string
  requirements: Requirement[]
  canCreate?: boolean
}

function statusTone(status: SpecPack['status']): 'neutral' | 'success' | 'info' | 'default' {
  if (status === SpecPackStatus.Exported) return 'success'
  if (status === SpecPackStatus.Ready) return 'info'
  return 'default'
}

function groupsSignature(groups: SpecPackGroup[]): string {
  return groups
    .map(
      (g) =>
        `${g.id}:${g.name}:${g.description ?? ''}:${g.requirements.map((r) => r.id).join(',')}`
    )
    .join('|')
}

function membershipSignature(groups: SpecPackGroup[]): string {
  return flattenSpecPackRequirements(groups)
    .map((r) => r.id)
    .sort()
    .join(',')
}

export function SpecPacksView({
  workspaceId,
  projectId,
  requirements,
  canCreate = true,
}: SpecPacksViewProps) {
  const { packs, createPack, markExported, removePack, updateGroups, updateTitle } =
    useSpecPacks(workspaceId, projectId)

  /** null = card gallery; set = outline + preview (read-only) */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Pack being edited in modal (from card context menu). */
  const [editPackId, setEditPackId] = useState<string | null>(null)
  const [cardMenu, setCardMenu] = useState<{
    packId: string
    x: number
    y: number
  } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [optimisticDoc, setOptimisticDoc] = useState<SpecPackPreviewDocument | null>(null)
  const [localGroups, setLocalGroups] = useState<SpecPackGroup[] | null>(null)
  const [outlineFocusId, setOutlineFocusId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(
    () => (selectedId ? packs.find((p) => p.id === selectedId) ?? null : null),
    [packs, selectedId]
  )
  const editPack = useMemo(
    () => (editPackId ? packs.find((p) => p.id === editPackId) ?? null : null),
    [packs, editPackId]
  )

  const {
    document: previewDoc,
    loading,
    refreshing,
    error,
    hardRefresh,
  } = useSpecPackPreview(workspaceId, selected)

  useEffect(() => {
    if (selectedId && !packs.some((p) => p.id === selectedId)) setSelectedId(null)
    if (editPackId && !packs.some((p) => p.id === editPackId)) setEditPackId(null)
  }, [packs, selectedId, editPackId])

  useEffect(() => {
    setOptimisticDoc(null)
    setLocalGroups(null)
    setOutlineFocusId(selected?.requirements[0]?.id ?? null)
  }, [selected?.id])

  useEffect(() => {
    if (!selected) return
    setLocalGroups(selected.groups)
  }, [selected])
  useEffect(() => {
    if (!cardMenu) return
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      setCardMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCardMenu(null)
    }
    const id = window.setTimeout(() => {
      document.addEventListener('click', onDoc)
      document.addEventListener('contextmenu', onDoc)
      document.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onDoc)
      document.removeEventListener('contextmenu', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [cardMenu])

  const displayDoc = optimisticDoc ?? previewDoc
  const outlineGroups = localGroups ?? selected?.groups ?? []

  const persistPackEdit = useCallback(
    (packId: string, next: { title: string; groups: SpecPackGroup[] }) => {
      const pack = packs.find((p) => p.id === packId)
      if (!pack) return

      if (next.title !== pack.title) {
        const renamed = updateTitle(packId, next.title)
        if (!renamed) {
          toast.error('Could not rename pack')
          return
        }
        if (selectedId === packId) {
          setOptimisticDoc((prev) => {
            const base = prev ?? previewDoc
            if (!base) return prev
            const nextDoc = { ...base, title: renamed.title }
            setCachedSpecPackPreview(renamed, nextDoc)
            return nextDoc
          })
        }
      }

      const membershipChanged =
        membershipSignature(pack.groups) !== membershipSignature(next.groups)
      const structureChanged =
        groupsSignature(pack.groups) !== groupsSignature(next.groups)

      if (structureChanged) {
        const updated = updateGroups(packId, next.groups)
        if (!updated) {
          toast.error('Could not update groups')
          return
        }
        if (selectedId === packId) {
          setLocalGroups(next.groups)
          if (membershipChanged) {
            invalidateSpecPackPreviewCache(packId)
            setOptimisticDoc(null)
          } else {
            setOptimisticDoc((prev) => {
              const base = prev ?? previewDoc
              if (!base) return prev
              const nextDoc = applySpecPackGroupsToPreview(base, next.groups)
              setCachedSpecPackPreview(updated, nextDoc)
              return nextDoc
            })
          }
        } else if (membershipChanged) {
          invalidateSpecPackPreviewCache(packId)
        }
      }

      toast.success('Spec Pack updated')
    },
    [packs, updateTitle, updateGroups, selectedId, previewDoc]
  )

  const handleExportDoc = async () => {
    if (!displayDoc || !selected) return
    setExporting(true)
    try {
      const { filename } = await exportSpecPackToDocx(displayDoc)
      invalidateSpecPackPreviewCache(selected.id)
      markExported(selected.id)
      toast.success(`Exported ${filename}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'DOCX export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!displayDoc || !selected) return
    setExporting(true)
    try {
      const { filename } = await exportSpecPackToExcel(displayDoc)
      invalidateSpecPackPreviewCache(selected.id)
      markExported(selected.id)
      toast.success(`Exported ${filename}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Excel export failed')
    } finally {
      setExporting(false)
    }
  }

  const openCardMenu = (packId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const pad = 8
    const menuW = 180
    const menuH = 120
    setCardMenu({
      packId,
      x: Math.min(e.clientX, window.innerWidth - menuW - pad),
      y: Math.min(e.clientY, window.innerHeight - menuH - pad),
    })
  }

  const gallery = (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-neutral-50">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:px-6">
        <div>
          <Typography as="h1" weight="medium">
            Spec Packs
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Click a card to preview · right-click to edit or delete.
          </Typography>
        </div>
        {canCreate ? (
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
            className="bg-neutral-800"
          >
            New Spec Pack
          </Button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
        {packs.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <FileText className="mb-3 h-8 w-8 text-neutral-300" aria-hidden />
            <Typography weight="medium">No packs yet</Typography>
            <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
              Bundle requirements into named groups, set reading order, then export DOCX or
              Excel.
            </Typography>
            {canCreate ? (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Create Spec Pack
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {packs.map((pack) => (
              <li key={pack.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(pack.id)}
                  onContextMenu={(e) => openCardMenu(pack.id, e)}
                  className={cn(
                    'flex h-full w-full flex-col border border-neutral-200 bg-white p-4 text-left',
                    'transition-colors hover:border-neutral-400 hover:bg-neutral-50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400'
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
                  <p className="mt-3 text-xs text-neutral-500">
                    {pack.groups.length} group{pack.groups.length === 1 ? '' : 's'} ·{' '}
                    {pack.requirements.length} requirement
                    {pack.requirements.length === 1 ? '' : 's'}
                  </p>
                  {pack.groups.length > 0 ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutral-400">
                      {pack.groups.map((g) => g.name).join(' · ')}
                    </p>
                  ) : null}
                  <p className="mt-auto pt-4 text-[11px] text-neutral-400">
                    Created {formatSpecPackDate(pack.createdAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )

  const detail = selected ? (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden border border-neutral-300 bg-white lg:flex-row">
      <aside className="flex max-h-[280px] w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 lg:max-h-none lg:h-auto lg:w-[360px] lg:self-stretch lg:border-b-0 lg:border-r">
        <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              setSelectedId(null)
              setOptimisticDoc(null)
              setLocalGroups(null)
            }}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft size={14} aria-hidden />
            All packs
          </button>
          <Typography weight="medium">Groups & reading order</Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Read-only · right-click the card to edit
          </Typography>
        </div>
        <SpecPackGroupOutline
          key={selected.id}
          groups={outlineGroups}
          activeRequirementId={outlineFocusId}
          onSelectRequirement={setOutlineFocusId}
          browseOnly
        />
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <Typography weight="medium" className="truncate">
                {selected.title}
              </Typography>
              {refreshing ? (
                <span className="text-xs font-normal text-neutral-400">Updating…</span>
              ) : null}
            </div>
            <Typography variant="small" tone="muted">
              Preview · Exact DOC layout (WYSIWYG)
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
              icon={<FileSpreadsheet size={14} />}
              disabled={!displayDoc || loading || exporting}
              onClick={() => void handleExportExcel()}
            >
              Export Excel
            </Button>
            <Button
              size="sm"
              icon={<FileDown size={14} />}
              disabled={!displayDoc || loading || exporting}
              onClick={() => void handleExportDoc()}
            >
              Export DOCX
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
      </section>
    </div>
  ) : null

  return (
    <>
      {selected ? detail : gallery}

      {cardMenu && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="fixed z-[200] min-w-[180px] border border-neutral-200 bg-white py-1 shadow-md"
              style={{ top: cardMenu.y, left: cardMenu.x }}
            >
              <button
                type="button"
                role="menuitem"
                className={cn(anchoredMenuItemClassName, 'flex items-center gap-2')}
                onClick={() => {
                  setSelectedId(cardMenu.packId)
                  setCardMenu(null)
                }}
              >
                <FileText size={14} aria-hidden />
                Open preview
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn(anchoredMenuItemClassName, 'flex items-center gap-2')}
                onClick={() => {
                  setEditPackId(cardMenu.packId)
                  setCardMenu(null)
                }}
              >
                <Pencil size={14} aria-hidden />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn(
                  anchoredMenuItemClassName,
                  'flex items-center gap-2 text-error hover:bg-error/5'
                )}
                onClick={() => {
                  const id = cardMenu.packId
                  setCardMenu(null)
                  invalidateSpecPackPreviewCache(id)
                  removePack(id)
                  if (selectedId === id) setSelectedId(null)
                  toast.success('Pack removed')
                }}
              >
                <Trash2 size={14} aria-hidden />
                Delete
              </button>
            </div>,
            document.body
          )
        : null}

      <SpecPackCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        requirements={requirements}
        onCreate={(input) => {
          createPack(input)
          toast.success('Spec Pack created')
        }}
      />

      {editPack ? (
        <SpecPackGroupsEditModal
          open
          onClose={() => setEditPackId(null)}
          title={editPack.title}
          groups={editPack.groups}
          onSave={(next) => {
            persistPackEdit(editPack.id, next)
            setEditPackId(null)
          }}
        />
      ) : null}
    </>
  )
}
