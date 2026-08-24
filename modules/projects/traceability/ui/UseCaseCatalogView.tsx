'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, SquareArrowOutUpRight } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Button,
  ConfirmDialog,
  DataTable,
  PageSkeleton,
  Select,
  Typography,
  useVisibleRowSelection,
} from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { useFunctionalCatalog } from '../hooks/useFunctionalCatalog'
import { useUseCaseCatalog } from '../hooks/useUseCaseCatalog'
import { UseCaseStatusBadge } from './UseCaseStatusBadge'
import { UseCaseDetailPanel } from './UseCaseDetailPanel'
import { UseCaseAddBar } from './UseCaseAddBar'
import { FunctionUseCaseLinkPanel } from './FunctionUseCaseLinkPanel'
import { useElicitationScopeLock } from '@/modules/projects/elicitation/presentation/hooks/useElicitationScopeLock'

export function UseCaseCatalogView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const searchParams = useSearchParams()
  const { useCases, total, loading, error, sort, setSort, offset, setOffset, pageSize, refetch, createUseCase, submitUseCasesBulk, deleteUseCase } =
    useUseCaseCatalog(projectId)
  const { functionalItems } = useFunctionalCatalog(projectId)
  const { isLocked: scopeLocked } = useElicitationScopeLock(projectId)
  const useCaseFromQuery = searchParams.get('useCaseId')
  const seededUseCaseRef = useRef(useCaseFromQuery)
  const [selectedId, setSelectedId] = useState<string | null>(useCaseFromQuery)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'catalog' | 'links'>(
    searchParams.get('tab') === 'links' ? 'links' : 'catalog'
  )
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    if (useCaseFromQuery && seededUseCaseRef.current !== useCaseFromQuery) {
      seededUseCaseRef.current = useCaseFromQuery
      setSelectedId(useCaseFromQuery)
      setView('catalog')
    }
  }, [useCaseFromQuery])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return useCases
    return useCases.filter(
      (uc) =>
        uc.name.toLowerCase().includes(q) ||
        uc.key.toLowerCase().includes(q) ||
        uc.primaryFunctionName?.toLowerCase().includes(q)
    )
  }, [useCases, search])

  const visibleKeys = useMemo(() => filtered.map((uc) => uc.id), [filtered])
  const [selectedKeys, setSelectedKeys] = useVisibleRowSelection(visibleKeys)

  const handleBulkDelete = async () => {
    if (scopeLocked || selectedKeys.size === 0) return
    const ids = filtered.filter((uc) => selectedKeys.has(uc.id)).map((uc) => uc.id)
    setBulkDeleting(true)
    let ok = 0
    let failed = 0
    try {
      for (const id of ids) {
        try {
          await deleteUseCase(id)
          ok += 1
        } catch {
          failed += 1
        }
      }
      if (ok > 0) toast.success(`Deleted ${ok} use case${ok === 1 ? '' : 's'}`)
      if (failed > 0) toast.error(`${failed} could not be deleted`)
      if (selectedId && ids.includes(selectedId)) setSelectedId(null)
      setConfirmBulkDelete(false)
      await refetch()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setBulkDeleting(false)
    }
  }

  if (loading && useCases.length === 0) {
    return <PageSkeleton variant="list" className="h-full p-4" />
  }

  if (view === 'links') {
    return (
      <div className="flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-3">
        <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col">
          <header className="mb-2 flex items-end justify-between border-b border-neutral-200 pb-2">
            <div>
              <Typography as="h1" size="md" weight="medium">
                Function → Use Case Links
              </Typography>
              <Typography variant="caption" tone="muted">
                Assign Use Cases to Functions. Set primary Function from the Use Case detail.
              </Typography>
            </div>
            <Button size="sm" variant="outline" onClick={() => setView('catalog')}>
              Back to catalog
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-hidden border border-neutral-300 bg-white">
            <FunctionUseCaseLinkPanel
              projectId={projectId}
              functionalItems={functionalItems}
              useCases={useCases}
              initialFunctionId={searchParams.get('functionId')}
              onChanged={refetch}
              isLocked={scopeLocked}
            />
          </div>
        </div>
      </div>
    )
  }

  const metaBits = [
    useCases.length ? `${useCases.length} use case${useCases.length > 1 ? 's' : ''}` : null,
  ].filter(Boolean)

  return (
    <div className="flex h-full min-h-0 flex-col px-3 py-3 lg:px-4 lg:py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col">
        <header className="shrink-0">
          <Link
            href={ROUTES.workspace.project(workspaceId, projectId)}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            ← Project
          </Link>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2">
            <div className="min-w-0">
              <Typography as="h1" size="md" weight="medium" className="truncate">
                Use Cases
              </Typography>
              <Typography variant="caption" tone="muted" className="mt-0.5">
                {metaBits.join(' · ') || 'No use cases yet'}
              </Typography>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={<SquareArrowOutUpRight size={14} />}
              onClick={() => setView('links')}
            >
              Bulk link
            </Button>
          </div>
        </header>

        {error ? (
          <Typography tone="error" className="mt-2 shrink-0">
            {error}
          </Typography>
        ) : null}

        <div className="mt-2 min-h-0 flex-1">
          <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(320px,440px)] overflow-hidden border border-neutral-300 bg-white">
            {/* Left: list */}
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200">
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-3 py-2">
                <div className="flex w-48 items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
                  <Search size={13} className="shrink-0 text-neutral-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search use cases…"
                    className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={sort}
                    onValueChange={(v: string) => setSort(v)}
                    options={[
                      { value: 'createdAt,asc', label: 'Oldest first' },
                      { value: 'createdAt,desc', label: 'Newest first' },
                      { value: 'key,asc', label: 'Key A–Z' },
                      { value: 'name,asc', label: 'Title A–Z' },
                    ]}
                    size="sm"
                    className="w-36"
                  />
                  <UseCaseAddBar
                    projectId={projectId}
                    onCreate={createUseCase}
                    onSubmitBulk={submitUseCasesBulk}
                    onBatchComplete={refetch}
                  />
                </div>
              </div>

              {!scopeLocked && selectedKeys.size > 0 && filtered.length > 0 ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-100 bg-neutral-50 px-3 py-2">
                  <Typography variant="small" weight="medium">
                    {selectedKeys.size} selected
                  </Typography>
                  <Button size="sm" tone="error" onClick={() => setConfirmBulkDelete(true)}>
                    Delete selected
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedKeys(new Set())}>
                    Clear
                  </Button>
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {useCases.length === 0 ? (
                  <Typography tone="muted" className="py-8 text-center" variant="small">
                    No use cases yet. Click &ldquo;Add Use Case&rdquo; above.
                  </Typography>
                ) : (
                  <DataTable
                    ariaLabel="Use case catalog"
                    rows={filtered}
                    rowKey={(useCase) => useCase.id}
                    selectedRowKey={selectedId}
                    onRowClick={(useCase) =>
                      setSelectedId(useCase.id === selectedId ? null : useCase.id)
                    }
                    selectedKeys={selectedKeys}
                    onSelectedKeysChange={setSelectedKeys}
                    columns={[
                      { id: 'key', header: 'Key', accessor: 'key', kind: 'code', width: '18%' },
                      { id: 'name', header: 'Name', accessor: 'name', width: '40%' },
                      {
                        id: 'function',
                        header: 'Function',
                        accessor: (useCase) => useCase.primaryFunctionName || '—',
                        kind: 'reference',
                        width: '28%',
                        cellClassName: 'text-neutral-500',
                      },
                      {
                        id: 'status',
                        header: 'Status',
                        width: '14%',
                        cell: (useCase) => <UseCaseStatusBadge status={useCase.status} />,
                      },
                    ]}
                  />
                )}
              </div>

              <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 px-3 py-1.5">
                <Typography variant="caption" tone="muted">
                  {total} use case{total === 1 ? '' : 's'}
                </Typography>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ChevronLeft size={14} />}
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - pageSize))}
                  />
                  <Typography variant="caption" tone="muted">
                    {total === 0 ? '0–0' : `${offset + 1}–${Math.min(offset + pageSize, total)}`}
                  </Typography>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<ChevronRight size={14} />}
                    disabled={offset + pageSize >= total}
                    onClick={() => setOffset(offset + pageSize)}
                  />
                </div>
              </div>
            </div>

            {/* Right: detail */}
            <aside className="bg-neutral-50/50 flex min-h-0 min-w-0 flex-col overflow-hidden">
              {selectedId ? (
                <UseCaseDetailPanel
                  workspaceId={workspaceId}
                  projectId={projectId}
                  useCaseId={selectedId}
                  onClose={() => setSelectedId(null)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                  <Typography weight="medium">Select a use case</Typography>
                  <Typography variant="small" tone="muted" className="mt-1 max-w-xs">
                    Pick a row on the left to view overview, conditions, flows, and more.
                  </Typography>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => {
          if (!bulkDeleting) setConfirmBulkDelete(false)
        }}
        title="Delete selected use cases"
        message={`Delete ${selectedKeys.size} selected use case${selectedKeys.size === 1 ? '' : 's'}? This cannot be undone.`}
        confirmLabel="Delete selected"
        variant="danger"
        loading={bulkDeleting}
        onConfirm={() => void handleBulkDelete()}
      />
    </div>
  )
}
