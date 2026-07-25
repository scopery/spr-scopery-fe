'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Input,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { QualityAddBar, type QualityCreateInput } from '@/modules/quality'
import { ROUTES } from '@/constants/routes'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import { useTraceabilityMatrix } from '../hooks/useTraceability'
import {
  CoverageStatus,
  coverageStatusLabel,
  coverageStatusTone,
  filterCoverageRows,
  formatTraceLinkEndpoints,
  type CoverageQuickFilter,
  type RequirementCoverageRow,
} from '../model/requirement-coverage'
import { LinkTestCaseDrawer } from './LinkTestCaseDrawer'

type QuickFilter = CoverageQuickFilter

const QUICK_FILTERS: {
  id: QuickFilter
  label: string
  countKey: 'requirements' | 'missingTests' | 'failedBlocked' | 'notEvaluated' | 'blocked'
}[] = [
  { id: 'all', label: 'All', countKey: 'requirements' },
  { id: 'gaps', label: 'Missing tests', countKey: 'missingTests' },
  { id: 'failed_or_blocked', label: 'Failed / blocked', countKey: 'failedBlocked' },
  { id: 'no_result', label: 'Not run', countKey: 'notEvaluated' },
  { id: 'open_defects', label: 'Open defects', countKey: 'blocked' },
]

export function TraceabilityMatrixView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const router = useRouter()
  const {
    rows,
    summary,
    links,
    requirements,
    testCases,
    loading,
    error,
    coverageUnavailable,
    refetch,
    createLink,
    linkTestsToRequirement,
    loadLinkableTestCases,
  } = useTraceabilityMatrix(projectId, workspaceId)

  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [moreOpen, setMoreOpen] = useState(false)
  const [techOpen, setTechOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerReqId, setDrawerReqId] = useState<string | null>(null)

  const filtered = useMemo(
    () => filterCoverageRows(rows, { query, quickFilter }),
    [rows, query, quickFilter]
  )

  const filterCounts = useMemo(
    () => ({
      requirements: summary.requirements,
      missingTests: summary.missingTests,
      failedBlocked: summary.failed + summary.blocked,
      notEvaluated: summary.notEvaluated,
      blocked: summary.blocked,
    }),
    [summary]
  )

  const drawerRow = rows.find((r) => r.requirementId === drawerReqId) ?? null
  const drawerLabel = drawerRow
    ? [drawerRow.code, drawerRow.title].filter(Boolean).join(' · ')
    : ''

  const openLinkDrawer = (requirementId?: string) => {
    setDrawerReqId(requirementId ?? null)
    setDrawerOpen(true)
    setMoreOpen(false)
  }

  const handleBulkCreate = async (input: QualityCreateInput) => {
    if (input.kind !== 'TRACE_LINK') return
    await createLink(input.payload)
  }

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) {
    return (
      <div className="p-lg">
        <Typography tone="error">{error}</Typography>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const requirementsHref = ROUTES.workspace.projectRequirements(workspaceId, projectId)
  const catalogHref = ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)
  const testPlansHref = ROUTES.workspace.projectTestPlans(workspaceId, projectId)
  const showCoverageNotice =
    summary.requirements > 0 &&
    summary.covered === 0 &&
    summary.missingTests === summary.requirements
  const canLink = rows.length > 0 && testCases.length > 0

  return (
    <div className="space-y-5 p-lg">
      {/* Header: title + actions on one baseline */}
      <header className="border-b border-neutral-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography as="h1" size="lg" weight="semibold">
            Traceability
          </Typography>
          <div className="relative flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => openLinkDrawer()}
              disabled={!canLink}
            >
              Link test case
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<MoreHorizontal size={16} />}
              aria-label="More actions"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
            />
            {moreOpen ? (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[240px] border border-neutral-200 bg-white py-1 shadow-md">
                <div className="border-b border-neutral-100 px-3 py-2">
                  <Typography variant="caption" tone="muted" className="mb-2 block">
                    Bulk link
                  </Typography>
                  <QualityAddBar
                    kind="TRACE_LINK"
                    label="trace link"
                    onCreate={handleBulkCreate}
                    onBatchComplete={async () => {
                      await refetch()
                      toast.success('Links created')
                      setMoreOpen(false)
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => {
                    setTechOpen(true)
                    setMoreOpen(false)
                    document
                      .getElementById('technical-trace-links')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Manage technical links
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <Typography variant="small" tone="muted" className="mt-1.5 max-w-2xl">
          Review requirement coverage across tests, results, defects and releases.
        </Typography>
      </header>

      {coverageUnavailable ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border border-warning/40 bg-warning/5 px-3 py-2">
          <Typography variant="small">
            Coverage summary from the report is temporarily unavailable. Rows still come from
            requirements and links.
          </Typography>
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            Retry coverage
          </Button>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <CoverageSummaryStrip
          summary={summary}
          active={quickFilter}
          onSelect={setQuickFilter}
        />
      ) : null}

      {rows.length === 0 ? (
        <CoverageEmptyState
          hasRequirements={requirements.length > 0}
          hasTestCases={testCases.length > 0}
          requirementsHref={requirementsHref}
          catalogHref={catalogHref}
          testPlansHref={testPlansHref}
          onLink={() => openLinkDrawer()}
        />
      ) : (
        <>
          {/* Toolbar: search + quick filters */}
          <div className="space-y-3">
            <Input
              size="md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search requirements or test cases…"
              className="max-w-xl"
            />
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_FILTERS.map((f) => {
                const count = filterCounts[f.countKey]
                const active = quickFilter === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setQuickFilter(f.id)}
                    className={cn(
                      'inline-flex h-9 items-center gap-1.5 border px-2.5 text-sm transition-colors',
                      active
                        ? 'border-secondary bg-secondary text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    )}
                  >
                    <span>{f.label}</span>
                    <span
                      className={cn(
                        'inline-flex min-w-[1.25rem] items-center justify-center px-1 text-xs font-medium',
                        active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {showCoverageNotice ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-neutral-50 px-3 py-2.5">
              <div className="min-w-0">
                <Typography variant="small" weight="medium">
                  {summary.missingTests} requirement
                  {summary.missingTests === 1 ? '' : 's'} missing test coverage.
                </Typography>
                <Typography variant="caption" tone="muted" className="mt-0.5 block">
                  Link an existing test case or create a new one.
                </Typography>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openLinkDrawer()}
                  disabled={testCases.length === 0}
                >
                  Link test case
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(testPlansHref)}
                >
                  Create test case
                </Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[32%]" />
                <col className="w-[23%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-neutral-50 text-neutral-600">
                <tr className="h-11">
                  <th className="px-3 py-2.5 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4" aria-hidden />
                      Requirement
                    </span>
                  </th>
                  <th className="px-3 py-2.5 font-medium">Test cases</th>
                  <th className="px-3 py-2.5 font-medium">Latest result</th>
                  <th className="px-3 py-2.5 font-medium">Defects</th>
                  <th className="px-3 py-2.5 font-medium">Coverage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No requirements match this filter.
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <CoverageRow
                      key={row.requirementId}
                      row={row}
                      expanded={expandedId === row.requirementId}
                      onToggle={() =>
                        setExpandedId((id) =>
                          id === row.requirementId ? null : row.requirementId
                        )
                      }
                      onLink={() => openLinkDrawer(row.requirementId)}
                      requirementsHref={requirementsHref}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Typography variant="caption" tone="muted">
            {summary.requirements} requirement{summary.requirements === 1 ? '' : 's'} ·{' '}
            {summary.covered} covered · {summary.missingTests} missing
            {filtered.length !== rows.length ? ` · Showing ${filtered.length}` : ''}
          </Typography>
        </>
      )}

      <section id="technical-trace-links" className="border-t border-neutral-200">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 py-3.5 text-left hover:bg-neutral-50/80"
          onClick={() => setTechOpen((o) => !o)}
        >
          <div className="min-w-0">
            <Typography weight="medium" className="inline">
              Technical trace links
            </Typography>
            <Typography variant="caption" tone="muted" className="ml-2 inline">
              {links.length}
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5 block">
              Raw project links for audit and troubleshooting.
            </Typography>
          </div>
          {techOpen ? (
            <ChevronDown size={16} className="shrink-0 text-neutral-500" />
          ) : (
            <ChevronRight size={16} className="shrink-0 text-neutral-500" />
          )}
        </button>
        {techOpen ? (
          <div className="border-t border-neutral-100 pb-2">
            {links.length === 0 ? (
              <Typography variant="small" tone="muted" className="py-4">
                No technical links yet.
              </Typography>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {links.map((l) => {
                  const ends = formatTraceLinkEndpoints(l)
                  return (
                    <li
                      key={l.id}
                      className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto_1fr]"
                    >
                      <span>{ends.source}</span>
                      <span className="text-neutral-500">
                        {l.linkType.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span>{ends.target}</span>
                      {l.createdByDisplayName || l.createdAt ? (
                        <Typography variant="caption" tone="muted" className="sm:col-span-3">
                          {[
                            l.createdByDisplayName,
                            l.createdAt ? new Date(l.createdAt).toLocaleString() : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}
      </section>

      <LinkTestCaseDrawer
        open={drawerOpen && Boolean(drawerReqId)}
        onClose={() => {
          setDrawerOpen(false)
          setDrawerReqId(null)
        }}
        requirementId={drawerReqId}
        requirementLabel={drawerLabel}
        testCases={testCases}
        alreadyLinkedIds={drawerRow?.testCases.map((t) => t.id) ?? []}
        loadLinkableTestCases={loadLinkableTestCases}
        onLink={async (ids) => {
          if (!drawerReqId) return
          try {
            await linkTestsToRequirement(drawerReqId, ids)
            toast.success(
              `Linked ${ids.length} test case${ids.length === 1 ? '' : 's'}`
            )
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      {drawerOpen && !drawerReqId ? (
        <RequirementPickerOverlay
          rows={rows}
          onPick={(id) => setDrawerReqId(id)}
          onCancel={() => setDrawerOpen(false)}
        />
      ) : null}
    </div>
  )
}

function CoverageSummaryStrip({
  summary,
  active,
  onSelect,
}: {
  summary: {
    requirements: number
    covered: number
    coveredPct: number
    missingTests: number
    failed: number
    blocked: number
  }
  active: QuickFilter
  onSelect: (f: QuickFilter) => void
}) {
  const items: { key: QuickFilter; label: string; value: string; highlight?: boolean }[] = [
    { key: 'all', label: 'Requirements', value: String(summary.requirements) },
    { key: 'all', label: 'Covered', value: `${summary.coveredPct}%` },
    {
      key: 'gaps',
      label: 'Missing tests',
      value: String(summary.missingTests),
      highlight: active === 'gaps',
    },
    {
      key: 'failed_or_blocked',
      label: 'Failed',
      value: String(summary.failed),
      highlight: active === 'failed_or_blocked',
    },
    {
      key: 'open_defects',
      label: 'Blocked',
      value: String(summary.blocked),
      highlight: active === 'open_defects',
    },
  ]

  return (
    <div className="flex flex-wrap items-stretch gap-px border border-neutral-200 bg-neutral-200">
      {items.map((item, i) => (
        <button
          key={`${item.label}-${i}`}
          type="button"
          onClick={() => onSelect(item.key)}
          className={cn(
            'flex min-h-[52px] min-w-[100px] flex-1 items-center gap-3 bg-white px-3 py-2 text-left hover:bg-neutral-50',
            item.highlight && 'bg-secondary/5 ring-1 ring-inset ring-secondary'
          )}
        >
          <span className="text-xs text-neutral-500">{item.label}</span>
          <span className="text-sm font-semibold text-neutral-900">{item.value}</span>
        </button>
      ))}
    </div>
  )
}

function CoverageRow({
  row,
  expanded,
  onToggle,
  onLink,
  requirementsHref,
}: {
  row: RequirementCoverageRow
  expanded: boolean
  onToggle: () => void
  onLink: () => void
  requirementsHref: string
}) {
  const router = useRouter()
  const tone = coverageStatusTone(row.coverageStatus)

  return (
    <>
      <tr className="min-h-16 border-t border-neutral-100">
        <td className="px-3 py-3 align-middle">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-900"
              aria-label={expanded ? 'Collapse' : 'Expand'}
              onClick={onToggle}
            >
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div className="min-w-0">
              <Typography weight="medium" className="leading-5">
                {row.code} · {row.title}
              </Typography>
              {row.reqType ? (
                <Typography variant="caption" tone="muted" className="mt-0.5 block leading-4">
                  {row.reqType}
                </Typography>
              ) : null}
            </div>
          </div>
        </td>
        <td className="px-3 py-3 align-middle">
          {row.testCaseCount === 0 ? (
            <div className="space-y-1">
              <Typography variant="small" tone="muted" className="block leading-5">
                No test cases
              </Typography>
              <button
                type="button"
                onClick={onLink}
                className="text-sm font-medium text-secondary hover:underline"
              >
                + Link test case
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Typography variant="small" className="block leading-5">
                {row.testCaseCount} test{row.testCaseCount === 1 ? '' : 's'}
              </Typography>
              <button
                type="button"
                onClick={onLink}
                className="text-sm text-neutral-600 hover:text-secondary hover:underline"
              >
                + Link another
              </button>
            </div>
          )}
        </td>
        <td className="px-3 py-3 align-middle">
          <Typography variant="small" className="leading-5">
            {row.latestResultLabel}
          </Typography>
        </td>
        <td className="px-3 py-3 align-middle">
          <Typography variant="small" className="leading-5">
            {row.defectsLabel}
          </Typography>
        </td>
        <td className="px-3 py-3 align-middle">
          <Badge
            size="sm"
            tone={tone}
            variant={
              row.coverageStatus === CoverageStatus.MissingTests ? 'solid' : 'soft'
            }
          >
            {coverageStatusLabel(row.coverageStatus)}
          </Badge>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-t border-neutral-50 bg-neutral-50/60">
          <td colSpan={5} className="px-3 py-4 pl-9">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Typography variant="caption" tone="muted" className="mb-2 block">
                  Test cases
                </Typography>
                {row.testCases.length === 0 ? (
                  <Typography variant="small" tone="muted">
                    No test cases linked
                  </Typography>
                ) : (
                  <ul className="space-y-1">
                    {row.testCases.map((tc) => (
                      <li
                        key={tc.id}
                        className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                      >
                        <span>{[tc.code, tc.title].filter(Boolean).join(' · ')}</span>
                        <span className="text-neutral-500">{tc.latestResultLabel}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <Typography variant="caption" tone="muted" className="block">
                  Open defects
                </Typography>
                {row.openDefects.length === 0 ? (
                  <Typography variant="small" tone="muted">
                    {row.defectsLabel === '—' ? '—' : 'None'}
                  </Typography>
                ) : (
                  <ul className="space-y-1">
                    {row.openDefects.map((d) => (
                      <li key={d.id} className="text-sm">
                        {[d.code, d.title].filter(Boolean).join(' · ')}
                      </li>
                    ))}
                  </ul>
                )}
                {row.targetReleaseLabel ? (
                  <Typography variant="small" className="mt-2">
                    Release: {row.targetReleaseLabel}
                  </Typography>
                ) : (
                  <Typography variant="small" className="mt-2">
                    Release linked: {row.hasRelease ? 'Yes' : 'No'}
                  </Typography>
                )}
                {row.moduleName ? (
                  <Typography variant="caption" tone="muted">
                    Module · {row.moduleName}
                  </Typography>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => router.push(requirementsHref)}
                >
                  Open requirements
                </Button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function CoverageEmptyState({
  hasRequirements,
  hasTestCases,
  requirementsHref,
  catalogHref,
  testPlansHref,
  onLink,
}: {
  hasRequirements: boolean
  hasTestCases: boolean
  requirementsHref: string
  catalogHref: string
  testPlansHref: string
  onLink: () => void
}) {
  const router = useRouter()

  if (!hasRequirements) {
    return (
      <div className="border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
        <Typography weight="medium">No requirements found</Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Create requirements before building test coverage for this project.
        </Typography>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push(requirementsHref)}
          >
            Open Requirements
          </Button>
          <Button size="sm" variant="outline" onClick={() => router.push(catalogHref)}>
            Open Functional Catalog
          </Button>
        </div>
      </div>
    )
  }

  if (!hasTestCases) {
    return (
      <div className="border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
        <Typography weight="medium">No test cases found</Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Create test cases before linking them to requirements.
        </Typography>
        <div className="mt-4 flex justify-center">
          <Button size="sm" variant="secondary" onClick={() => router.push(testPlansHref)}>
            Create test case
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
      <Typography weight="medium">Ready to link coverage</Typography>
      <Typography variant="small" tone="muted" className="mt-1">
        Link existing test cases to requirements to build the coverage matrix.
      </Typography>
      <div className="mt-4 flex justify-center">
        <Button size="sm" variant="secondary" onClick={onLink}>
          Link test case
        </Button>
      </div>
    </div>
  )
}

function RequirementPickerOverlay({
  rows,
  onPick,
  onCancel,
}: {
  rows: RequirementCoverageRow[]
  onPick: (id: string) => void
  onCancel: () => void
}) {
  const [q, setQ] = useState('')
  const list = rows.filter((r) => {
    const hay = `${r.code} ${r.title}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-900/40 p-4">
      <div className="w-full max-w-md border border-neutral-200 bg-white p-4 shadow-xl">
        <Typography weight="semibold" className="mb-1">
          Choose a requirement
        </Typography>
        <Typography variant="small" tone="muted" className="mb-3">
          Then pick the test cases that cover it.
        </Typography>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search requirements…"
          className="mb-3"
        />
        <ul className="mb-3 max-h-64 overflow-y-auto border border-neutral-200">
          {list.map((r) => (
            <li key={r.requirementId}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
                onClick={() => onPick(r.requirementId)}
              >
                {r.code} · {r.title}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
