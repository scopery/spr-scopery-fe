'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Button,
  PageSkeleton,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { useProject } from '@/modules/projects/project/hooks/useProject'
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
import { ImportFunctionalItemsModal } from './ImportFunctionalItemsModal'
import { SimpleExcelImportPanel } from './SimpleExcelImportPanel'
import { NON_FUNCTIONAL_ITEM_IMPORT_SPEC } from '../lib/excelImportSpecs'

type MainTab = 'fr' | 'nfr' | 'map' | 'import'

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: 'fr', label: 'Functional' },
  { id: 'nfr', label: 'NFR' },
  { id: 'map', label: 'Links' },
  { id: 'import', label: 'Import' },
]

export function FunctionalCatalogView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const searchParams = useSearchParams()
  const frFromQuery = searchParams.get('fr')

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
  } = useFunctionalCatalog(projectId)
  const { frWithoutAnchors, refetch: refetchCoverage } =
    useFunctionalAnchorCoverage(projectId)

  const [tab, setTab] = useState<MainTab>('fr')
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
    if (!functionalItems.some((i) => i.id === frFromQuery)) return
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
              (input.type as typeof FunctionalItemType.Functional) ||
              FunctionalItemType.Functional,
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
            (input.category as typeof NonFunctionalCategory.Other) ||
            NonFunctionalCategory.Other,
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
        </header>

        {error ? (
          <Typography tone="error" className="mt-2 shrink-0">
            {error}
          </Typography>
        ) : null}

        <div className="mt-2 min-h-0 flex-1">
          {tab === 'fr' ? (
            <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(260px,360px)] overflow-hidden border border-neutral-200 bg-white">
              {/* Left: list — independent scroll */}
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200">
                <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setFrImportOpen(true)}>
                      Import
                    </Button>
                    <FunctionalCatalogAddBar
                      defaultKind="FR"
                      onCreate={handleBulkCreate}
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
                    <table className="w-full table-fixed text-left text-sm">
                      <thead className="sticky top-0 z-[1] bg-white">
                        <tr className="border-b border-neutral-200 text-neutral-500">
                          <th className="w-[36%] bg-white pb-2 pr-3">Code</th>
                          <th className="w-[64%] bg-white pb-2">Title</th>
                        </tr>
                      </thead>
                      <tbody>
                        {functionalItems.map((item) => {
                          const selected = selectedFrId === item.id
                          return (
                            <tr
                              key={item.id}
                              className={cn(
                                'cursor-pointer border-b border-neutral-100 transition-colors',
                                selected ? 'bg-neutral-200' : 'hover:bg-neutral-50'
                              )}
                              aria-selected={selected}
                              onClick={() => setSelectedFrId(item.id)}
                            >
                              <td className="truncate py-2.5 pr-3 font-medium text-neutral-900">
                                {item.code}
                              </td>
                              <td className="truncate py-2.5 text-neutral-800">
                                {item.title}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right: detail — fills height, scrolls inside */}
              <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-neutral-50/50">
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
            <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(260px,360px)] overflow-hidden border border-neutral-200 bg-white">
              <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-neutral-200">
                <div className="shrink-0 border-b border-neutral-100 px-3 py-2">
                  <FunctionalCatalogAddBar
                    defaultKind="NFR"
                    onCreate={handleBulkCreate}
                    onBatchComplete={handleBatchComplete}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                  {nonFunctionalItems.length === 0 ? (
                    <Typography tone="muted" className="py-8 text-center" variant="small">
                      No NFRs yet. Use Add NFR above — choose Single or Bulk.
                    </Typography>
                  ) : (
                    <table className="w-full table-fixed text-left text-sm">
                      <thead className="sticky top-0 z-[1] bg-white">
                        <tr className="border-b border-neutral-200 text-neutral-500">
                          <th className="w-[28%] bg-white pb-2 pr-3">Code</th>
                          <th className="w-[44%] bg-white pb-2 pr-3">Title</th>
                          <th className="w-[28%] bg-white pb-2">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nonFunctionalItems.map((item) => {
                          const selected = selectedNfrId === item.id
                          return (
                            <tr
                              key={item.id}
                              className={cn(
                                'cursor-pointer border-b border-neutral-100 transition-colors',
                                selected ? 'bg-neutral-200' : 'hover:bg-neutral-50'
                              )}
                              aria-selected={selected}
                              onClick={() => setSelectedNfrId(item.id)}
                            >
                              <td className="truncate py-2.5 pr-3 font-medium text-neutral-900">
                                {item.code}
                              </td>
                              <td className="truncate py-2.5 pr-3 text-neutral-800">
                                {item.title}
                              </td>
                              <td className="truncate py-2.5 text-neutral-500">
                                {item.category}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-neutral-50/50">
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
                            {[selectedNfr.priority, selectedNfr.scopeType].filter(Boolean).join(' · ')}
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

          {tab === 'import' ? (
            <div className="h-full min-h-0 overflow-y-auto border border-neutral-200 bg-white p-3">
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
                      One file. Duplicate codes are skipped (409). For quick multi-row add,
                      prefer Add NFR (paste from Excel).
                    </Typography>
                    <SimpleExcelImportPanel
                      title="Import NFRs"
                      spec={NON_FUNCTIONAL_ITEM_IMPORT_SPEC}
                      onImportRow={async (row) => {
                        await createNfr(
                          {
                            code: row.code,
                            title: row.title,
                            description: row.description || null,
                            category: row.category,
                            priority: row.priority,
                            scopeType: row.scopeType,
                            targetMetric: row.targetMetric || null,
                          },
                          { refresh: false }
                        )
                      }}
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
