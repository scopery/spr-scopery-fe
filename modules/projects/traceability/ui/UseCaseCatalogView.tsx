'use client'

import { useMemo, useState } from 'react'
import { Search, SquareArrowOutUpRight } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Button, DataTable, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useFunctionalCatalog } from '../hooks/useFunctionalCatalog'
import { useUseCaseCatalog } from '../hooks/useUseCaseCatalog'
import { UseCaseStatusBadge } from './UseCaseStatusBadge'
import { UseCaseDetailPanel } from './UseCaseDetailPanel'
import { UseCaseAddBar } from './UseCaseAddBar'
import { FunctionUseCaseLinkPanel } from './FunctionUseCaseLinkPanel'

export function UseCaseCatalogView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const searchParams = useSearchParams()
  const { useCases, loading, error, refetch, createUseCase } = useUseCaseCatalog(projectId)
  const { functionalItems } = useFunctionalCatalog(projectId)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'catalog' | 'links'>(
    searchParams.get('tab') === 'links' ? 'links' : 'catalog'
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return useCases
    return useCases.filter(
      (uc) =>
        uc.name.toLowerCase().includes(q) ||
        uc.key.toLowerCase().includes(q) ||
        uc.primaryFunctionName.toLowerCase().includes(q)
    )
  }, [useCases, search])

  if (loading && useCases.length === 0) {
    return <PageSkeleton variant="list" className="h-full p-4" />
  }

  if (view === 'links') {
    return (
      <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4">
        <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col">
          <header className="mb-2 flex items-end justify-between border-b border-neutral-200 pb-2">
            <div>
              <Typography as="h1" size="md" weight="medium">
                Function → Use Case Links
              </Typography>
              <Typography variant="caption" tone="muted">
                Assign existing Use Cases to their Functions in bulk.
              </Typography>
            </div>
            <Button size="sm" variant="outline" onClick={() => setView('catalog')}>
              Back to catalog
            </Button>
          </header>
          <div className="min-h-0 flex-1">
            <FunctionUseCaseLinkPanel
              projectId={projectId}
              functionalItems={functionalItems}
              useCases={useCases}
              initialFunctionId={searchParams.get('functionId')}
              onChanged={refetch}
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
    <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4 lg:py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col">
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
              Function → Use Case
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
                <UseCaseAddBar
                  functionalItems={functionalItems}
                  onCreate={createUseCase}
                  onBatchComplete={refetch}
                />
              </div>

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
    </div>
  )
}
