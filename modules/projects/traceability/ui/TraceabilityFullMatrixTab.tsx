'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Button, DataTable, Input, PageSkeleton, Select, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useTraceabilityFullMatrix } from '../hooks/useTraceabilityFullMatrix'
import {
  DisplayCoverageStatus,
  TraceGapCode,
  buildLayerSteps,
  buildNfrLayerSteps,
  evaluateGaps,
  formatImplementationSummary,
  formatTestsCell,
  isNfrRequirement,
  primaryActionableGap,
  recommendedActionLabel,
  resolveDisplayCoverageStatus,
  type TraceabilityMatrixRow,
} from '../model/requirement-traceability'
import { RequirementTraceDetailDrawer } from './RequirementTraceDetailDrawer'
import { CoveragePath, FilterChipBar, StatusBadge } from './TraceabilityStatusBits'

interface TraceabilityFullMatrixTabProps {
  projectId: string
  initialGapCode?: string | null
  initialShowGapsOnly?: boolean
}

const TYPE_OPTIONS = [
  { value: 'FUNCTIONAL', label: 'Functional pipeline' },
  { value: 'NON_FUNCTIONAL', label: 'NFR pipeline' },
]

function CompactCell({ text, empty }: { text: string; empty?: boolean }) {
  return (
    <span
      className={cn(
        'line-clamp-2 text-xs',
        empty ? 'text-neutral-400' : 'font-medium text-neutral-800'
      )}
      title={text}
    >
      {text}
    </span>
  )
}

function matrixActionLabel(row: TraceabilityMatrixRow): string | null {
  const isNfr = isNfrRequirement(row.requirementType)
  const gaps = evaluateGaps({
    gapCodes: row.gapCodes,
    functionCount: row.functionCount,
    requiresUseCaseResolved: row.requiresUseCaseResolved,
  })
  const primary = isNfr ? null : primaryActionableGap(gaps)
  const nfrActionCodes = new Set<string>([
    TraceGapCode.MissingNfrSpecification,
    TraceGapCode.MissingVerificationTarget,
    TraceGapCode.MissingVerificationCase,
    TraceGapCode.VerificationFailed,
    TraceGapCode.Blocked,
  ])
  const nfrActionCode = row.gapCodes.find((code) => nfrActionCodes.has(code))
  if (isNfr) return nfrActionCode ? recommendedActionLabel(nfrActionCode) : 'Review NFR'
  return primary ? recommendedActionLabel(primary.gapCode) : null
}

export function TraceabilityFullMatrixTab({
  projectId,
  initialGapCode = null,
  initialShowGapsOnly = false,
}: TraceabilityFullMatrixTabProps) {
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [coverageStatus, setCoverageStatus] = useState('')
  const [gapCode, setGapCode] = useState(initialGapCode ?? '')
  const [requirementType, setRequirementType] = useState('FUNCTIONAL')
  const [showGapsOnly, setShowGapsOnly] = useState(initialShowGapsOnly)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(25)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerAction, setDrawerAction] = useState<'function' | 'useCase' | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim())
      setOffset(0)
    }, 250)
    return () => window.clearTimeout(t)
  }, [q])

  const apiCoverageStatus =
    coverageStatus === DisplayCoverageStatus.NotCovered ? 'PARTIAL' : coverageStatus || undefined

  const query = useMemo(
    () => ({
      q: debouncedQ || undefined,
      coverageStatus: apiCoverageStatus,
      gapCode: gapCode || undefined,
      requirementType: requirementType || undefined,
      showGapsOnly:
        showGapsOnly || coverageStatus === DisplayCoverageStatus.NotCovered || undefined,
      limit,
      offset,
    }),
    [
      debouncedQ,
      apiCoverageStatus,
      gapCode,
      requirementType,
      showGapsOnly,
      coverageStatus,
      offset,
      limit,
    ]
  )

  const { data, loading, error, refetch } = useTraceabilityFullMatrix(projectId, query)

  const items = useMemo(() => {
    const list = data?.items ?? []
    if (coverageStatus === DisplayCoverageStatus.NotCovered) {
      return list.filter(
        (r) =>
          (isNfrRequirement(r.requirementType)
            ? r.coverageStatus
            : resolveDisplayCoverageStatus(r)) === DisplayCoverageStatus.NotCovered
      )
    }
    if (coverageStatus === 'PARTIAL') {
      return list.filter(
        (r) =>
          (isNfrRequirement(r.requirementType)
            ? r.coverageStatus
            : resolveDisplayCoverageStatus(r)) === DisplayCoverageStatus.Partial
      )
    }
    return list
  }, [data?.items, coverageStatus])

  const notCoveredCount = useMemo(
    () =>
      (data?.items ?? []).filter(
        (r) =>
          (isNfrRequirement(r.requirementType)
            ? r.coverageStatus
            : resolveDisplayCoverageStatus(r)) === DisplayCoverageStatus.NotCovered
      ).length,
    [data?.items]
  )

  const missingFnCount = useMemo(
    () =>
      (data?.items ?? []).filter(
        (r) => !isNfrRequirement(r.requirementType) && r.functionCount === 0
      ).length,
    [data?.items]
  )

  const chipActiveId = useMemo(() => {
    if (coverageStatus === DisplayCoverageStatus.NotCovered) return 'not_covered'
    if (coverageStatus === 'COMPLETE') return 'complete'
    if (gapCode === TraceGapCode.MissingFunction) return 'missing_fn'
    if (gapCode === TraceGapCode.MissingTest) return 'missing_test'
    if (coverageStatus === 'PARTIAL') return 'partial'
    return 'all'
  }, [coverageStatus, gapCode])

  const total = data?.page.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1)
  const currentPage = Math.min(totalPages, Math.floor(offset / limit) + 1)
  const pageOptions = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1
        return { value: String(page), label: String(page) }
      }),
    [totalPages]
  )

  useEffect(() => {
    if (total === 0) {
      if (offset !== 0) setOffset(0)
      return
    }
    const maxOffset = Math.max(0, (totalPages - 1) * limit)
    if (offset > maxOffset) setOffset(maxOffset)
  }, [total, totalPages, limit, offset])

  const openRowAction = (row: TraceabilityMatrixRow) => {
    if (isNfrRequirement(row.requirementType)) {
      setSelectedId(row.requirementId)
      setDrawerAction(null)
      return
    }
    const gaps = evaluateGaps({
      gapCodes: row.gapCodes,
      functionCount: row.functionCount,
      requiresUseCaseResolved: row.requiresUseCaseResolved,
    })
    const primary = primaryActionableGap(gaps)
    setSelectedId(row.requirementId)
    if (primary?.gapCode === TraceGapCode.MissingFunction) setDrawerAction('function')
    else if (
      primary?.gapCode === TraceGapCode.MissingUseCase ||
      primary?.gapCode === TraceGapCode.IncompleteUseCase
    ) {
      setDrawerAction('useCase')
    } else setDrawerAction(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit max-w-full flex-wrap items-center gap-2">
          <div className="w-52 shrink-0">
            <Input
              fullWidth
              size="sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              prefix={<Search size={14} />}
            />
          </div>
          <Select
            size="sm"
            value={requirementType}
            onValueChange={(v: string) => {
              setRequirementType(v)
              setCoverageStatus('')
              setGapCode('')
              setShowGapsOnly(false)
              setOffset(0)
            }}
            options={TYPE_OPTIONS}
            className="w-52 shrink-0"
          />
        </div>
        <FilterChipBar
          activeId={chipActiveId}
          onSelect={(id) => {
            setOffset(0)
            if (id === 'all') {
              setCoverageStatus('')
              setGapCode('')
              setShowGapsOnly(false)
              return
            }
            if (id === 'not_covered') {
              setCoverageStatus(DisplayCoverageStatus.NotCovered)
              setGapCode('')
              setShowGapsOnly(true)
              return
            }
            if (id === 'complete') {
              setCoverageStatus('COMPLETE')
              setGapCode('')
              setShowGapsOnly(false)
              return
            }
            if (id === 'missing_fn') {
              setCoverageStatus('')
              setGapCode(TraceGapCode.MissingFunction)
              setShowGapsOnly(true)
              return
            }
            if (id === 'missing_test') {
              setCoverageStatus('')
              setGapCode(TraceGapCode.MissingTest)
              setShowGapsOnly(true)
            }
          }}
          items={[
            {
              id: 'all',
              label: 'All',
              count: data?.summary.requirements ?? 0,
            },
            {
              id: 'not_covered',
              label: 'Not covered',
              count: notCoveredCount || data?.summary.partialCount || 0,
            },
            ...(requirementType === 'FUNCTIONAL'
              ? [
                  {
                    id: 'missing_fn',
                    label: 'Missing Function',
                    count: data?.summary.missingFunctions ?? missingFnCount,
                  },
                ]
              : []),
            {
              id: 'missing_test',
              label: requirementType === 'NON_FUNCTIONAL' ? 'Missing Verification' : 'Missing Test',
              count: data?.summary.missingTests ?? 0,
            },
            {
              id: 'complete',
              label: 'Complete',
              count: data?.summary.completeCount ?? 0,
            },
          ]}
        />
      </div>

      {loading ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <div>
          <Typography tone="error">{error}</Typography>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!loading && !error && data ? (
        <>
          <DataTable
            className="border border-neutral-200 bg-white"
            tableClassName="min-w-[960px]"
            ariaLabel="Requirement traceability matrix"
            rows={items}
            rowKey={(row) => row.requirementId}
            selectedRowKey={selectedId}
            onRowClick={(row) => {
              setDrawerAction(null)
              setSelectedId(row.requirementId)
            }}
            emptyMessage="No requirements match these filters."
            columns={[
              {
                id: 'requirement',
                header: 'Requirement',
                kind: 'code',
                cell: (row) => (
                  <div className="max-w-[220px]">
                    <Typography variant="small" className="truncate">
                      {row.code || '—'}
                    </Typography>
                    <Typography variant="small" tone="muted" className="line-clamp-1">
                      {row.title}
                    </Typography>
                  </div>
                ),
              },
              {
                id: 'function',
                header: requirementType === 'NON_FUNCTIONAL' ? 'NFR specification' : 'Function',
                cell: (row) => {
                  if (isNfrRequirement(row.requirementType)) {
                    const text =
                      row.nfrSpecificationConfigured === undefined
                        ? 'Open detail'
                        : row.nfrSpecificationConfigured
                          ? 'Configured'
                          : 'Missing'
                    return (
                      <CompactCell text={text} empty={row.nfrSpecificationConfigured === false} />
                    )
                  }
                  const preview = row.previews.functions[0]
                  const text =
                    row.functionCount === 0
                      ? '—'
                      : preview
                        ? `${preview.name}${
                            row.previewMore.functions + row.previews.functions.length - 1 > 0
                              ? ` +${row.previewMore.functions + row.previews.functions.length - 1}`
                              : ''
                          }`
                        : `${row.functionCount} functions`
                  return <CompactCell text={text} empty={row.functionCount === 0} />
                },
              },
              {
                id: 'useCase',
                header: requirementType === 'NON_FUNCTIONAL' ? 'Verification target' : 'Use Case',
                cell: (row) => {
                  if (isNfrRequirement(row.requirementType)) {
                    const count = row.verificationTargetCount
                    return (
                      <CompactCell
                        text={
                          count === undefined
                            ? 'Open detail'
                            : `${count} target${count === 1 ? '' : 's'}`
                        }
                        empty={count === 0}
                      />
                    )
                  }
                  const preview = row.previews.useCases[0]
                  const text =
                    row.useCaseCount === 0
                      ? '—'
                      : preview
                        ? `${preview.name}${
                            row.previewMore.useCases + row.previews.useCases.length - 1 > 0
                              ? ` +${row.previewMore.useCases + row.previews.useCases.length - 1}`
                              : ''
                          }`
                        : `${row.useCaseCount} use cases`
                  return <CompactCell text={text} empty={row.useCaseCount === 0} />
                },
              },
              {
                id: 'implementation',
                header:
                  requirementType === 'NON_FUNCTIONAL' ? 'Verification case' : 'Implementation',
                cell: (row) =>
                  isNfrRequirement(row.requirementType) ? (
                    <CompactCell
                      text={
                        row.verificationCaseCount === undefined
                          ? 'Open detail'
                          : `${row.verificationCaseCount} case${row.verificationCaseCount === 1 ? '' : 's'}`
                      }
                      empty={row.verificationCaseCount === 0}
                    />
                  ) : (
                    <CompactCell
                      text={formatImplementationSummary(
                        row.previews.implementation,
                        row.implementationCount
                      )}
                      empty={row.implementationCount === 0}
                    />
                  ),
              },
              {
                id: 'tests',
                header: requirementType === 'NON_FUNCTIONAL' ? 'Measured result' : 'Tests',
                cell: (row) =>
                  isNfrRequirement(row.requirementType) ? (
                    <CompactCell
                      text={
                        row.latestVerificationResult ??
                        (row.verificationResultCount === undefined
                          ? 'Open detail'
                          : `${row.verificationResultCount} result${row.verificationResultCount === 1 ? '' : 's'}`)
                      }
                      empty={row.verificationResultCount === 0}
                    />
                  ) : (
                    <CompactCell text={formatTestsCell(row)} empty={row.testCaseCount === 0} />
                  ),
              },
              {
                id: 'coverage',
                header: 'Coverage path',
                cell: (row) => {
                  const isNfr = isNfrRequirement(row.requirementType)
                  const status = isNfr ? row.coverageStatus : resolveDisplayCoverageStatus(row)
                  const steps = isNfr
                    ? buildNfrLayerSteps({
                        specificationConfigured: row.nfrSpecificationConfigured,
                        verificationTargetCount: row.verificationTargetCount,
                        verificationCaseCount: row.verificationCaseCount,
                        verificationResultCount: row.verificationResultCount,
                      })
                    : buildLayerSteps({
                        functionCount: row.functionCount,
                        useCaseCount: row.useCaseCount,
                        implementationCount: row.implementationCount,
                        testCaseCount: row.testCaseCount,
                        requiresUseCaseResolved: row.requiresUseCaseResolved,
                      })
                  return (
                    <div className="space-y-1.5">
                      <StatusBadge status={status} />
                      <CoveragePath steps={steps} />
                    </div>
                  )
                },
              },
              {
                id: 'action',
                header: 'Next action',
                cell: (row) => {
                  const label = matrixActionLabel(row)
                  return label ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto px-0 font-normal text-neutral-800 underline hover:bg-transparent"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation()
                        openRowAction(row)
                      }}
                    >
                      {label}
                    </Button>
                  ) : (
                    '—'
                  )
                },
              },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Typography variant="small" tone="muted">
                Showing {items.length === 0 ? 0 : offset + 1}–{offset + items.length} of {total}
              </Typography>
              <div className="w-[7.5rem]">
                <Select
                  size="sm"
                  value={String(limit)}
                  onValueChange={(value: string) => {
                    setLimit(Number(value))
                    setOffset(0)
                  }}
                  options={[
                    { value: '25', label: '25 / page' },
                    { value: '50', label: '50 / page' },
                    { value: '100', label: '100 / page' },
                  ]}
                  aria-label="Rows per page"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 px-1.5 text-neutral-900 hover:bg-transparent hover:text-neutral-900 disabled:bg-transparent disabled:text-neutral-400"
                disabled={currentPage <= 1 || total === 0}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                icon={<ChevronLeft size={14} />}
              >
                Previous
              </Button>
              <Typography as="span" variant="small" className="text-neutral-900">
                Page
              </Typography>
              <div className="w-16">
                <Select
                  size="sm"
                  value={String(currentPage)}
                  onValueChange={(value: string) => {
                    const page = Number(value)
                    if (!Number.isFinite(page) || page < 1) return
                    setOffset((page - 1) * limit)
                  }}
                  options={pageOptions}
                  disabled={total === 0}
                  aria-label="Page number"
                />
              </div>
              <Typography variant="small" tone="muted" className="whitespace-nowrap">
                of {totalPages}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 px-1.5 text-neutral-900 hover:bg-transparent hover:text-neutral-900 disabled:bg-transparent disabled:text-neutral-400"
                disabled={currentPage >= totalPages || total === 0}
                onClick={() => setOffset((o) => o + limit)}
              >
                Next
                <ChevronRight size={14} aria-hidden />
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <RequirementTraceDetailDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null)
          setDrawerAction(null)
        }}
        projectId={projectId}
        requirementId={selectedId}
        initialLinkMode={drawerAction}
        onChanged={() => void refetch()}
      />
    </div>
  )
}
