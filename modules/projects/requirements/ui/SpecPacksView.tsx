'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileDown, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, ContentLoader, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { exportSpecPackToDoc } from '../export/spec-pack-doc'
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
  const { packs, createPack, markExported, removePack, updateGroups } = useSpecPacks(
    workspaceId,
    projectId
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editFocusGroupId, setEditFocusGroupId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [optimisticDoc, setOptimisticDoc] = useState<SpecPackPreviewDocument | null>(null)
  const [localGroups, setLocalGroups] = useState<SpecPackGroup[] | null>(null)
  const [outlineFocusId, setOutlineFocusId] = useState<string | null>(null)
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSigRef = useRef<string | null>(null)

  const selected = useMemo(
    () => packs.find((p) => p.id === selectedId) ?? packs[0] ?? null,
    [packs, selectedId]
  )

  const { document, loading, refreshing, error, hardRefresh } = useSpecPackPreview(
    workspaceId,
    selected
  )

  useEffect(() => {
    setOptimisticDoc(null)
    setLocalGroups(null)
    pendingSigRef.current = null
    if (persistTimer.current) {
      clearTimeout(persistTimer.current)
      persistTimer.current = null
    }
    setOutlineFocusId(selected?.requirements[0]?.id ?? null)
  }, [selected?.id])

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
          // New/removed reqs need a full preview rebuild (reorder-only cache is incomplete).
          // pack.updatedAt changes via reload → useSpecPackPreview auto-loads.
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
      <aside className="flex max-h-[220px] w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 lg:max-h-none lg:h-auto lg:w-[260px] lg:self-stretch lg:border-b-0 lg:border-r">
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
            <Button
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setCreateOpen(true)}
              className="bg-neutral-800"
            >
              New
            </Button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {packs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <Typography weight="medium">No packs yet</Typography>
              <Typography variant="small" tone="muted" className="mt-1 max-w-[220px]">
                Bundle requirements into named groups, set reading order, then export.
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
                        {pack.groups.length} group{pack.groups.length === 1 ? '' : 's'} ·{' '}
                        {pack.requirements.length} req · {formatSpecPackDate(pack.createdAt)}
                      </p>
                      <p className="mt-1 line-clamp-1 text-[11px] text-neutral-400">
                        {pack.groups.map((g) => g.name).join(' · ')}
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
        <aside className="flex max-h-[260px] w-full shrink-0 flex-col overflow-hidden border-b border-neutral-200 lg:max-h-none lg:h-auto lg:w-[280px] lg:self-stretch lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-neutral-100 px-3 py-2.5">
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

      {selected ? (
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
      ) : null}

      {selected ? (
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
      ) : null}
    </div>
  )
}
