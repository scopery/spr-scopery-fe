'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, SquareArrowOutUpRight } from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button, DataTable, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { useProject } from '@/modules/projects/project'
import {
  FunctionalItemPriority,
  FunctionalItemType,
  NonFunctionalCategory,
  NonFunctionalScopeType,
} from '../model/functional-catalog'
import { useFunctionalCatalog } from '../hooks/useFunctionalCatalog'
import { useFunctionalAnchorCoverage } from '../hooks/useFunctionalAnchorCoverage'
import { FunctionalCatalogAddBar } from './FunctionalCatalogAddBar'
import type { FunctionalCatalogBulkCreateInput } from './FunctionalCatalogBulkAddModal'
import { FunctionalItemDetailPanel } from './FunctionalItemDetailPanel'
import { RequirementFunctionalLinkPanel } from './RequirementFunctionalLinkPanel'
import { RequirementNonFunctionalLinkPanel } from './RequirementNonFunctionalLinkPanel'
import { ImportFunctionalItemsModal } from './ImportFunctionalItemsModal'
import { SimpleExcelImportPanel } from './SimpleExcelImportPanel'
import { NON_FUNCTIONAL_ITEM_IMPORT_SPEC } from '../lib/excelImportSpecs'

type MainTab = 'fr' | 'nfr' | 'import'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'fr', label: 'Functional' },
  { id: 'nfr', label: 'NFR' },
  { id: 'import', label: 'Import' },
]

export function FunctionalCatalogView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const searchParams = useSearchParams()
  const frFromQuery = searchParams.get('fr')
  const tabFromQuery = searchParams.get('tab')
  const seededFrRef = useRef<string | null>(null)

  const { project, loading: projectLoading } = useProject(workspaceId, projectId)
  const {
    functionalItems,
    nonFunctionalItems,
    loading,
    error,
    createFr,
    updateFr,
    createNfr,
    refetch,
    submitFunctionalItemsBulk,
    submitNonFunctionalItemsBulk,
  } = useFunctionalCatalog(projectId)
  const { frWithoutAnchors, refetch: refetchCoverage } = useFunctionalAnchorCoverage(projectId)

  const [tab, setTab] = useState<MainTab | 'map' | 'map-nfr'>(() => {
    if (tabFromQuery === 'map') return 'map'
    if (tabFromQuery === 'map-nfr') return 'map-nfr'
    if (tabFromQuery === 'nfr' || tabFromQuery === 'import') return tabFromQuery
    return 'fr'
  })
  const [frSearch, setFrSearch] = useState('')
  const [nfrSearch, setNfrSearch] = useState('')

  const filteredFr = useMemo(() => {
    const q = frSearch.trim().toLowerCase()
    if (!q) return functionalItems
    return functionalItems.filter(
      (i) => i.code.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)
    )
  }, [functionalItems, frSearch])

  const filteredNfr = useMemo(() => {
    const q = nfrSearch.trim().toLowerCase()
    if (!q) return nonFunctionalItems
    return nonFunctionalItems.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    )
  }, [nonFunctionalItems, nfrSearch])
  const [selectedFrId, setSelectedFrId] = useState<string | null>(null)
  const [selectedNfrId, setSelectedNfrId] = useState<string | null>(null)
  const [importKind, setImportKind] = useState<'fr' | 'nfr'>('fr')
  const [frImportOpen, setFrImportOpen] = useState(false)

  const selectedFr = functionalItems.find((i) => i.id === selectedFrId) ?? null
  const selectedNfr = nonFunctionalItems.find((i) => i.id === selectedNfrId) ?? null

  useEffect(() => {
    if (selectedFrId && !functionalItems.some((i) => i.id === selectedFrId)) {
      setSelectedFrId(null)
    }
    if (selectedNfrId && !nonFunctionalItems.some((i) => i.id === selectedNfrId)) {
      setSelectedNfrId(null)
    }
  }, [functionalItems, nonFunctionalItems, selectedFrId, selectedNfrId])

  useEffect(() => {
    if (!frFromQuery) return
    if (seededFrRef.current === frFromQuery) return
    if (!functionalItems.some((i) => i.id === frFromQuery)) return
    seededFrRef.current = frFromQuery
    setTab('fr')
    setSelectedFrId(frFromQuery)
  }, [frFromQuery, functionalItems])

  const handleBulkCreate = useCallback(
    async (input: FunctionalCatalogBulkCreateInput) => {
      if (input.kind === 'FR') {
        await createFr(
          {
            code: input.code,
            title: input.title,
            description: input.description ?? null,
            priority:
              (input.priority as typeof FunctionalItemPriority.Medium) ||
              FunctionalItemPriority.Medium,
            type:
              (input.type as typeof FunctionalItemType.Functional) || FunctionalItemType.Functional,
            workspaceId,
          },
          { refresh: false }
        )
        return
      }
      await createNfr(
        {
          code: input.code,
          title: input.title,
          description: input.description ?? null,
          category:
            (input.category as typeof NonFunctionalCategory.Other) || NonFunctionalCategory.Other,
          priority:
            (input.priority as typeof FunctionalItemPriority.Medium) ||
            FunctionalItemPriority.Medium,
          scopeType:
            (input.scopeType as typeof NonFunctionalScopeType.System) ||
            NonFunctionalScopeType.System,
        },
        { refresh: false }
      )
    },
    [createFr, createNfr, workspaceId]
  )

  const handleBatchComplete = useCallback(
    async (kind: 'FR' | 'NFR') => {
      await refetch({ silent: true })
      if (kind === 'FR') {
        void refetchCoverage()
        setTab('fr')
      } else {
        setTab('nfr')
      }
    },
    [refetch, refetchCoverage]
  )

  const handleSubmitBulk = useCallback(
    async (items: FunctionalCatalogBulkCreateInput[]) => {
      const kind = items[0]?.kind ?? 'FR'
      if (kind === 'FR') {
        return submitFunctionalItemsBulk(
          items.map((input) => ({
            code: input.code,
            title: input.title,
            description: input.description ?? null,
            priority:
              (input.priority as typeof FunctionalItemPriority.Medium) ||
              FunctionalItemPriority.Medium,
            type:
              (input.type as typeof FunctionalItemType.Functional) ||
              FunctionalItemType.Functional,
            acceptanceCriteria: input.acceptanceCriteria?.length
              ? input.acceptanceCriteria
              : null,
            businessRules: input.businessRules?.length ? input.businessRules : null,
            workspaceId,
          }))
        )
      }
      return submitNonFunctionalItemsBulk(
        items.map((input) => ({
          code: input.code,
          title: input.title,
          description: input.description ?? null,
          category:
            (input.category as typeof NonFunctionalCategory.Other) ||
            NonFunctionalCategory.Other,
          priority:
            (input.priority as typeof FunctionalItemPriority.Medium) ||
            FunctionalItemPriority.Medium,
          scopeType:
            (input.scopeType as typeof NonFunctionalScopeType.System) ||
            NonFunctionalScopeType.System,
          targetMetric: input.targetMetric ?? null,
        }))
      )
    },
    [submitFunctionalItemsBulk, submitNonFunctionalItemsBulk, workspaceId]
  )

  if (
    (loading || projectLoading) &&
    functionalItems.length === 0 &&
    nonFunctionalItems.length === 0
  ) {
    return <PageSkeleton variant="list" className="h-full p-4" />
  }

  const metaBits = [
    project?.name,
    functionalItems.length ? `${functionalItems.length} FR` : null,
    nonFunctionalItems.length ? `${nonFunctionalItems.length} NFR` : null,
    frWithoutAnchors.length ? `${frWithoutAnchors.length} unanchored` : null,
  ].filter(Boolean)

  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4 lg:py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col">
        <header className="shrink-0">
          {tab === 'map' || tab === 'map-nfr' ? (
            <div className="mb-2 flex items-end justify-between border-b border-neutral-200 pb-2">
              <div>
                <Typography as="h1" size="md" weight="medium">
                  {tab === 'map' ? 'Requirement → Function' : 'Requirement → NFR'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {tab === 'map'
                    ? 'Link requirements to functional items.'
                    : 'Link requirements to non-functional items.'}
                </Typography>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTab(tab === 'map' ? 'fr' : 'nfr')}
              >
                Back to catalog
              </Button>
            </div>
          ) : (
            <>
              <Link
                href={ROUTES.workspace.project(workspaceId, projectId)}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                ← Project
              </Link>

              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2">
                <div className="min-w-0">
                  <Typography as="h1" size="md" weight="medium" className="truncate">
                    Functional Catalog
                  </Typography>
                  <Typography variant="caption" tone="muted" className="mt-0.5">
                    {metaBits.join(' · ') || 'Project catalog'}
                  </Typography>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<SquareArrowOutUpRight size={14} />}
                    onClick={() => setTab('map')}
                  >
                    Requirement → Function
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<SquareArrowOutUpRight size={14} />}
                    onClick={() => setTab('map-nfr')}
                  >
                    Requirement → NFR
                  </Button>
                </div>
              </div>

              <nav aria-label="Catalog" className="mt-1 flex gap-0.5 border-b border-neutral-200">
                {MAIN_TABS.map((t) => {
                  const active = tab === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => {
                        setTab(t.id)
                        if (t.id !== 'fr') setSelectedFrId(null)
                        if (t.id !== 'nfr') setSelectedNfrId(null)
                      }}
                      className={cn(
                        'border-b-2 px-2.5 py-1.5 text-sm transition-colors',
                        active
                          ? 'border-primary text-primary'
                          : 'border-transparent text-neutral-500 hover:text-neutral-800'
                      )}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </nav>
            </>
          )}
        </header>

        {error ? (
          <Typography tone="error" className="mt-2 shrink-0">
            {error}
          </Typography>
        ) : null}

        <div className="mt-2 min-h-0 flex-1">
          {tab === 'fr' ? (
            <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(260px,360px)] overflow-hidden border border-neutral-300 bg-white">
              {/* Left: list — independent scroll */}
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200">
                <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-3 py-2">
                  <div className="flex w-48 items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
                    <Search size={13} className="shrink-0 text-neutral-400" />
                    <input
                      type="text"
                      value={frSearch}
                      onChange={(e) => setFrSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setFrImportOpen(true)}>
                      Import
                    </Button>
                    <FunctionalCatalogAddBar
                      defaultKind="FR"
                      onCreate={handleBulkCreate}
                      onSubmitBulk={handleSubmitBulk}
                      onBatchComplete={handleBatchComplete}
                    />
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                  {functionalItems.length === 0 ? (
                    <Typography tone="muted" className="py-8 text-center" variant="small">
                      No functional items yet. Use Add FR or Import above.
                    </Typography>
                  ) : (
                    <DataTable
                      ariaLabel="Functional catalog"
                      rows={filteredFr}
                      rowKey={(item) => item.id}
                      selectedRowKey={selectedFrId}
                      onRowClick={(item) => setSelectedFrId(item.id)}
                      columns={[
                        {
                          id: 'code',
                          header: 'Code',
                          accessor: 'code',
                          kind: 'code',
                          width: '36%',
                        },
                        {
                          id: 'title',
                          header: 'Title',
                          accessor: 'title',
                          width: '64%',
                        },
                      ]}
                    />
                  )}
                </div>
              </div>

              {/* Right: detail — fills height, scrolls inside */}
              <aside className="bg-neutral-50/50 flex min-h-0 min-w-0 flex-col overflow-hidden">
                {selectedFr ? (
                  <FunctionalItemDetailPanel
                    projectId={projectId}
                    workspaceId={workspaceId}
                    item={selectedFr}
                    onClose={() => setSelectedFrId(null)}
                    onSave={async (payload) => {
                      await updateFr(selectedFr.id, payload)
                    }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                    <Typography weight="medium">Select a functional item</Typography>
                    <Typography variant="small" tone="muted" className="mt-1 max-w-xs">
                      Pick a row on the left to view details, anchors, and rules.
                    </Typography>
                  </div>
                )}
              </aside>
            </div>
          ) : null}

          {tab === 'nfr' ? (
            <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(260px,360px)] overflow-hidden border border-neutral-300 bg-white">
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200">
                <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-3 py-2">
                  <div className="flex w-48 items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
                    <Search size={13} className="shrink-0 text-neutral-400" />
                    <input
                      type="text"
                      value={nfrSearch}
                      onChange={(e) => setNfrSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                  <FunctionalCatalogAddBar
                    defaultKind="NFR"
                    onCreate={handleBulkCreate}
                    onSubmitBulk={handleSubmitBulk}
                    onBatchComplete={handleBatchComplete}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                  {nonFunctionalItems.length === 0 ? (
                    <Typography tone="muted" className="py-8 text-center" variant="small">
                      No NFRs yet. Use Add NFR above — choose Single or Bulk.
                    </Typography>
                  ) : (
                    <DataTable
                      ariaLabel="Non-functional catalog"
                      rows={filteredNfr}
                      rowKey={(item) => item.id}
                      selectedRowKey={selectedNfrId}
                      onRowClick={(item) => setSelectedNfrId(item.id)}
                      columns={[
                        {
                          id: 'code',
                          header: 'Code',
                          accessor: 'code',
                          kind: 'code',
                          width: '28%',
                        },
                        {
                          id: 'title',
                          header: 'Title',
                          accessor: 'title',
                          width: '44%',
                        },
                        {
                          id: 'category',
                          header: 'Category',
                          accessor: 'category',
                          width: '28%',
                          cellClassName: 'text-neutral-500',
                        },
                      ]}
                    />
                  )}
                </div>
              </div>

              <aside className="bg-neutral-50/50 flex min-h-0 min-w-0 flex-col overflow-hidden">
                {selectedNfr ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
                      <div className="min-w-0">
                        <Typography variant="small" tone="muted" className="leading-none">
                          NFR · {selectedNfr.code}
                        </Typography>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-900"
                        aria-label="Close detail"
                        onClick={() => setSelectedNfrId(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                      <Stack direction="vertical" spacing="md">
                        <div className="min-w-0">
                          <div className="mb-1 text-xs text-neutral-500">Title</div>
                          <div className="font-calsans border-b border-transparent py-1.5 text-base text-neutral-900">
                            {selectedNfr.title}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1 text-xs text-neutral-500">Category</div>
                          <div className="border-b border-transparent py-1.5 text-sm text-neutral-800">
                            {selectedNfr.category}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1 text-xs text-neutral-500">Priority · Scope</div>
                          <div className="border-b border-transparent py-1.5 text-sm text-neutral-800">
                            {[selectedNfr.priority, selectedNfr.scopeType]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="mb-1 text-xs text-neutral-500">Description</div>
                          <div
                            className={cn(
                              'border-b border-transparent py-1.5 text-sm',
                              selectedNfr.description?.trim()
                                ? 'text-neutral-800'
                                : 'text-neutral-400'
                            )}
                          >
                            {selectedNfr.description?.trim() || 'No description'}
                          </div>
                        </div>
                      </Stack>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                    <Typography weight="medium">Select an NFR</Typography>
                    <Typography variant="small" tone="muted" className="mt-1 max-w-xs">
                      Pick a row on the left to view details.
                    </Typography>
                  </div>
                )}
              </aside>
            </div>
          ) : null}

          {tab === 'map' ? (
            <div className="h-full min-h-0 overflow-hidden bg-white">
              <RequirementFunctionalLinkPanel
                workspaceId={workspaceId}
                projectId={projectId}
                functionalItems={functionalItems}
              />
            </div>
          ) : null}

          {tab === 'map-nfr' ? (
            <div className="h-full min-h-0 overflow-hidden bg-white">
              <RequirementNonFunctionalLinkPanel
                workspaceId={workspaceId}
                projectId={projectId}
                nonFunctionalItems={nonFunctionalItems}
              />
            </div>
          ) : null}

          {tab === 'import' ? (
            <div className="h-full min-h-0 overflow-y-auto border border-neutral-300 bg-white p-3">
              <Stack direction="vertical" spacing="md">
                <div className="max-w-xs">
                  <Select
                    value={importKind}
                    onValueChange={(v: string) => setImportKind(v as 'fr' | 'nfr')}
                    options={[
                      { value: 'fr', label: 'Functional items' },
                      { value: 'nfr', label: 'Non-functional items' },
                    ]}
                    placeholder="What to import"
                  />
                </div>
                {importKind === 'fr' ? (
                  <div className="max-w-xl space-y-3">
                    <Typography variant="small" tone="muted">
                      Preview matches by code (exact) or title (fuzzy), resolve conflicts, then
                      create/update in one step. Defaults: priority MEDIUM, type FUNCTIONAL.
                    </Typography>
                    <Button variant="primary" onClick={() => setFrImportOpen(true)}>
                      Import functional items
                    </Button>
                  </div>
                ) : (
                  <>
                    <Typography variant="small" tone="muted">
                      One file → one async bulk job. Duplicate codes fail as job item errors. Prefer
                      Add NFR (paste from Excel) for quick multi-row add.
                    </Typography>
                    <SimpleExcelImportPanel
                      title="Import NFRs"
                      spec={NON_FUNCTIONAL_ITEM_IMPORT_SPEC}
                      onSubmitBulk={(rows) =>
                        submitNonFunctionalItemsBulk(
                          rows.map((row) => ({
                            code: row.code,
                            title: row.title,
                            description: row.description || null,
                            category: row.category as never,
                            priority: row.priority as never,
                            scopeType: row.scopeType as never,
                            targetMetric: row.targetMetric || null,
                          }))
                        )
                      }
                      onComplete={async () => {
                        await refetch({ silent: true })
                        setTab('nfr')
                      }}
                    />
                  </>
                )}
              </Stack>
            </div>
          ) : null}
        </div>
      </div>

      <ImportFunctionalItemsModal
        open={frImportOpen}
        projectId={projectId}
        workspaceId={workspaceId}
        onClose={() => setFrImportOpen(false)}
        onImported={async () => {
          await refetch({ silent: true })
          void refetchCoverage()
          setTab('fr')
        }}
      />
    </div>
  )
}
