'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { Badge, Button, ContentLoader, Input, Typography } from '@/shared/ui'
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
import { SpecPackAddRequirementsModal } from './SpecPackAddRequirementsModal'
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

const REORDER_DEBOUNCE_MS = 400

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
  /** null = card gallery; set = open outline + preview for that pack */
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editFocusGroupId, setEditFocusGroupId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [optimisticDoc, setOptimisticDoc] = useState<SpecPackPreviewDocument | null>(null)
  const [localGroups, setLocalGroups] = useState<SpecPackGroup[] | null>(null)
  const [outlineFocusId, setOutlineFocusId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSigRef = useRef<string | null>(null)

  const selected = useMemo(
    () => (selectedId ? packs.find((p) => p.id === selectedId) ?? null : null),
    [packs, selectedId]
  )

  const { document, loading, refreshing, error, hardRefresh } = useSpecPackPreview(
    workspaceId,
    selected
  )

  useEffect(() => {
    if (selectedId && !packs.some((p) => p.id === selectedId)) {
      setSelectedId(null)
    }
  }, [packs, selectedId])

  useEffect(() => {
    setOptimisticDoc(null)
    setLocalGroups(null)
    pendingSigRef.current = null
    setEditingTitle(false)
    if (persistTimer.current) {
      clearTimeout(persistTimer.current)
      persistTimer.current = null
    }
    setOutlineFocusId(selected?.requirements[0]?.id ?? null)
  }, [selected?.id])

  useEffect(() => {
    if (!editingTitle && selected) setTitleDraft(selected.title)
  }, [selected?.title, editingTitle, selected])

  useEffect(() => {
    if (!selected) return
    if (pendingSigRef.current) return
    setLocalGroups(selected.groups)
  }, [selected])

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
    }
  }, [])

  const displayDoc = optimisticDoc ?? document
  const outlineGroups = localGroups ?? selected?.groups ?? []

  const handleGroupsChange = useCallback(
    (groups: SpecPackGroup[]) => {
      if (!selected) return
      const prevMembership = membershipSignature(localGroups ?? selected.groups)
      const nextMembership = membershipSignature(groups)
      const membershipChanged = prevMembership !== nextMembership

      setLocalGroups(groups)
      pendingSigRef.current = groupsSignature(groups)

      setOptimisticDoc((prev) => {
        const base = prev ?? document
        return base ? applySpecPackGroupsToPreview(base, groups) : prev
      })

      if (persistTimer.current) clearTimeout(persistTimer.current)
      const packId = selected.id
      persistTimer.current = setTimeout(() => {
        const updated = updateGroups(packId, groups)
        if (!updated) return
        if (membershipChanged) {
          invalidateSpecPackPreviewCache(packId)
          setOptimisticDoc(null)
          pendingSigRef.current = null
          return
        }
        setOptimisticDoc((prev) => {
          if (prev) setCachedSpecPackPreview(updated, prev)
          pendingSigRef.current = null
          return prev
        })
      }, REORDER_DEBOUNCE_MS)
    },
    [selected, localGroups, document, updateGroups]
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

  const commitTitle = () => {
    if (!selected) return
    const next = titleDraft.trim() || 'Untitled Spec Pack'
    setEditingTitle(false)
    if (next === selected.title) return
    const updated = updateTitle(selected.id, next)
    if (!updated) {
      toast.error('Could not rename pack')
      setTitleDraft(selected.title)
      return
    }
    setOptimisticDoc((prev) => {
      const base = prev ?? document
      if (!base) return prev
      const nextDoc = { ...base, title: updated.title }
      setCachedSpecPackPreview(updated, nextDoc)
      return nextDoc
    })
    toast.success('Title updated')
  }

  const backToGallery = () => {
    setSelectedId(null)
    setEditingTitle(false)
    setOptimisticDoc(null)
    setLocalGroups(null)
  }

  /* ── Card gallery (no pack open) ── */
  if (!selected) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-neutral-50">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 lg:px-6">
          <div>
            <Typography as="h1" weight="medium">
              Spec Packs
            </Typography>
            <Typography variant="small" tone="muted" className="mt-0.5">
              Open a pack to edit groups, preview, and export.
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

  /* ── Detail: outline + preview ── */
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden border border-neutral-300 bg-white lg:flex-row">
      <aside className="flex max-h-[260px] w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 lg:max-h-none lg:h-auto lg:w-[280px] lg:self-stretch lg:border-b-0 lg:border-r">
        <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
          <button
            type="button"
            onClick={backToGallery}
            className="mb-2 inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft size={12} aria-hidden />
            All packs
          </button>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Typography variant="small" weight="medium">
                Groups & reading order
              </Typography>
              <Typography variant="caption" tone="muted">
                Read-only list · edit in modal
              </Typography>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant="outline"
                icon={<Pencil size={14} />}
                onClick={() => {
                  setEditFocusGroupId(null)
                  setEditOpen(true)
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<Plus size={14} />}
                onClick={() => setAddOpen(true)}
                disabled={requirements.length === 0}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        <SpecPackGroupOutline
          key={selected.id}
          groups={outlineGroups}
          activeRequirementId={outlineFocusId}
          onSelectRequirement={setOutlineFocusId}
          browseOnly
          onRequestEdit={(groupId) => {
            setEditFocusGroupId(groupId)
            setEditOpen(true)
          }}
        />
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <div className="flex max-w-xl flex-wrap items-center gap-2">
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTitle()
                    if (e.key === 'Escape') {
                      setTitleDraft(selected.title)
                      setEditingTitle(false)
                    }
                  }}
                  autoFocus
                  fullWidth
                  aria-label="Spec Pack title"
                />
                <Button size="sm" onClick={commitTitle}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTitleDraft(selected.title)
                    setEditingTitle(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-1.5">
                <Typography weight="medium" className="truncate">
                  {selected.title}
                </Typography>
                <button
                  type="button"
                  className="shrink-0 text-neutral-400 hover:text-neutral-800"
                  onClick={() => {
                    setTitleDraft(selected.title)
                    setEditingTitle(true)
                  }}
                  aria-label="Edit pack title"
                  title="Edit title"
                >
                  <Pencil size={14} />
                </button>
                {refreshing ? (
                  <span className="text-xs font-normal text-neutral-400">Updating…</span>
                ) : null}
              </div>
            )}
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

      <SpecPackAddRequirementsModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        groups={outlineGroups}
        requirements={requirements}
        defaultGroupId={
          outlineGroups.find((g) =>
            g.requirements.some((r) => r.id === outlineFocusId)
          )?.id ?? outlineGroups[0]?.id
        }
        onAdd={(next) => {
          handleGroupsChange(next)
          toast.success('Requirements added')
        }}
      />

      <SpecPackGroupsEditModal
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditFocusGroupId(null)
        }}
        groups={outlineGroups}
        focusGroupId={editFocusGroupId}
        onSave={(next) => {
          handleGroupsChange(next)
          toast.success('Groups updated')
        }}
      />
    </div>
  )
}
