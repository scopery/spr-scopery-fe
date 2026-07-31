'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Badge, Button, DataTable, Input, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { qualityCasesHref, qualityDefectsHref, qualityRunsHref } from '@/modules/quality'
import { cn } from '@/utils/cn'
import { useTraceabilityMatrix } from '../hooks/useTraceability'
import {
  coverageNextAction,
  coverageStatusLabel,
  coverageStatusTone,
  filterCoverageRows,
  type CoverageNextActionType,
  type CoverageQuickFilter,
  type RequirementCoverageRow,
} from '../model/requirement-coverage'
import { FilterChipBar } from './TraceabilityStatusBits'
import { TestCoverageDetailDrawer } from './TestCoverageDetailDrawer'

type QuickFilter = CoverageQuickFilter

const QUICK_FILTERS: Array<{
  id: QuickFilter
  label: string
  countKey: 'requirements' | 'missingTests' | 'failed' | 'blocked' | 'notEvaluated' | 'defects'
}> = [
  { id: 'all', label: 'All', countKey: 'requirements' },
  { id: 'gaps', label: 'Missing Tests', countKey: 'missingTests' },
  { id: 'failed', label: 'Failed', countKey: 'failed' },
  { id: 'blocked', label: 'Blocked', countKey: 'blocked' },
  { id: 'no_result', label: 'Not Run', countKey: 'notEvaluated' },
  { id: 'open_defects', label: 'Open Defects', countKey: 'defects' },
]

interface TraceabilityMatrixViewProps {
  /** When true, omit outer page chrome (used as the Test Coverage tab). */
  embedded?: boolean
}

function resultTone(result: string): 'success' | 'error' | 'progress' | 'neutral' | 'warning' {
  switch (result.toUpperCase()) {
    case 'PASSED':
      return 'success'
    case 'FAILED':
      return 'error'
    case 'BLOCKED':
      return 'progress'
    case 'SKIPPED':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function TraceabilityMatrixView({ embedded = false }: TraceabilityMatrixViewProps) {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const router = useRouter()
  const {
    rows,
    summary,
    requirements,
    testCases,
    loading,
    error,
    coverageUnavailable,
    refetch,
    linkTestsToRequirement,
    loadLinkableTestCases,
  } = useTraceabilityMatrix(projectId, workspaceId)

  const [query, setQuery] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null)
  const [openInLinkMode, setOpenInLinkMode] = useState(false)

  const filtered = useMemo(
    () => filterCoverageRows(rows, { query, quickFilter }),
    [rows, query, quickFilter]
  )
  const selectedRow = rows.find((row) => row.requirementId === selectedRequirementId) ?? null
  const testRunsHref = qualityRunsHref(workspaceId, projectId)
  const testCasesHref = qualityCasesHref(workspaceId, projectId, { type: 'functional' })
  const verificationCasesHref = qualityCasesHref(workspaceId, projectId, { type: 'nfr' })
  const defectsHref = qualityDefectsHref(workspaceId, projectId)
  const requirementsHref = ROUTES.workspace.projectRequirements(workspaceId, projectId)

  const filterCounts = useMemo(
    () => ({
      requirements: summary.requirements,
      missingTests: rows.filter((row) => {
        const type = (row.reqType ?? '').toUpperCase().replace(/-/g, '_')
        return type !== 'NON_FUNCTIONAL' && type !== 'NFR' && row.coverageStatus === 'missing_tests'
      }).length,
      failed: rows.filter((row) => row.latestResultLabel.toUpperCase() === 'FAILED').length,
      blocked: rows.filter((row) => row.latestResultLabel.toUpperCase() === 'BLOCKED').length,
      notEvaluated: summary.notEvaluated,
      defects: rows.filter((row) => row.hasDefect).length,
    }),
    [rows, summary]
  )

  const openRow = (row: RequirementCoverageRow, linkMode = false) => {
    setSelectedRequirementId(row.requirementId)
    setOpenInLinkMode(linkMode)
  }

  const runRowAction = (row: RequirementCoverageRow, type: CoverageNextActionType) => {
    if (type === 'LINK_TEST_CASE') {
      router.push(testCasesHref)
    } else if (type === 'OPEN_NFR') {
      openRow(row)
    } else if (type === 'RESOLVE_BLOCKER') {
      router.push(defectsHref)
    } else {
      router.push(testRunsHref)
    }
  }

  if (loading) {
    return <PageSkeleton variant="list" className={embedded ? undefined : 'p-lg'} />
  }
  if (error) {
    return (
      <div className={embedded ? undefined : 'p-lg'}>
        <Typography tone="error">{error}</Typography>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', !embedded && 'p-lg')}>
      <header className={embedded ? 'pb-1' : 'border-b border-neutral-200 pb-4'}>
        <Typography as={embedded ? 'h2' : 'h1'} size={embedded ? 'base' : 'lg'} weight="semibold">
          Test Coverage
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Requirement coverage, latest execution result, and open defects.
        </Typography>
      </header>

      {coverageUnavailable ? (
        <div className="border-warning/40 bg-warning/5 flex flex-wrap items-center justify-between gap-2 border px-3 py-2">
          <Typography variant="small">
            Coverage report is temporarily unavailable. Requirement links are still shown.
          </Typography>
          <Button size="sm" variant="ghost" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
          <span>
            <strong className="text-neutral-900">{summary.requirements}</strong> Requirements
          </span>
          <span className="text-neutral-300">·</span>
          <span>
            <strong className="text-success">{summary.covered}</strong> Covered
          </span>
          <span className="text-neutral-300">·</span>
          <span>
            <strong className="text-error">{filterCounts.missingTests}</strong> Missing Tests
          </span>
          <span className="text-neutral-300">·</span>
          <span>
            <strong className="text-error">{filterCounts.failed}</strong> Failed
          </span>
          <span className="text-neutral-300">·</span>
          <span>
            <strong className="text-progress">{filterCounts.blocked}</strong> Blocked
          </span>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="border border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
          <Typography weight="medium">
            {requirements.length === 0 ? 'No requirements found' : 'No test coverage yet'}
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            {requirements.length === 0
              ? 'Create Requirements before reviewing test coverage.'
              : testCases.length === 0
                ? 'Create Test Cases, then link them to Requirements.'
                : 'Open a Requirement to link an existing Test Case.'}
          </Typography>
          <Button
            size="sm"
            variant="primary"
            className="mt-4"
            onClick={() =>
              router.push(requirements.length === 0 ? requirementsHref : testCasesHref)
            }
          >
            {requirements.length === 0 ? 'Open Requirements' : 'Open Test Cases'}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Requirements or Test Cases…"
              className="max-w-xl"
              prefix={<Search size={14} />}
            />
            <FilterChipBar
              activeId={quickFilter}
              onSelect={(id) => setQuickFilter(id as QuickFilter)}
              items={QUICK_FILTERS.map((filter) => ({
                id: filter.id,
                label: filter.label,
                count: filterCounts[filter.countKey],
              }))}
            />
          </div>

          <DataTable
            className="border border-neutral-200 bg-white"
            tableClassName="min-w-[880px]"
            ariaLabel="Requirement test coverage"
            rows={filtered}
            rowKey={(row) => row.requirementId}
            selectedRowKey={selectedRequirementId}
            onRowClick={(row) => openRow(row)}
            emptyMessage="No Requirements match these filters."
            columns={[
              {
                id: 'requirement',
                header: 'Requirement',
                kind: 'code',
                cell: (row) => (
                  <div className="max-w-[280px]">
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
                id: 'assets',
                header: 'Verification assets',
                align: 'right',
                accessor: (row) =>
                  ['NON_FUNCTIONAL', 'NFR'].includes(
                    (row.reqType ?? '').toUpperCase().replace(/-/g, '_')
                  )
                    ? 'NFR'
                    : row.testCaseCount,
              },
              {
                id: 'result',
                header: 'Latest result',
                cell: (row) => {
                  const isNfr = ['NON_FUNCTIONAL', 'NFR'].includes(
                    (row.reqType ?? '').toUpperCase().replace(/-/g, '_')
                  )
                  return isNfr || row.testCaseCount === 0 ? (
                    '—'
                  ) : (
                    <Badge
                      size="sm"
                      variant="soft"
                      tone={resultTone(row.latestResultLabel)}
                      className="border-0"
                    >
                      {row.latestResultLabel}
                    </Badge>
                  )
                },
              },
              {
                id: 'defects',
                header: 'Open Defects',
                align: 'right',
                accessor: (row) => row.openDefects.length || (row.hasDefect ? row.defectsLabel : 0),
              },
              {
                id: 'coverage',
                header: 'Coverage',
                cell: (row) => {
                  const isNfr = ['NON_FUNCTIONAL', 'NFR'].includes(
                    (row.reqType ?? '').toUpperCase().replace(/-/g, '_')
                  )
                  return isNfr ? (
                    <Badge size="sm" variant="soft" tone="neutral" className="border-0">
                      NFR detail
                    </Badge>
                  ) : (
                    <Badge
                      size="sm"
                      variant="soft"
                      tone={coverageStatusTone(row.coverageStatus)}
                      className="border-0"
                    >
                      {coverageStatusLabel(row.coverageStatus)}
                    </Badge>
                  )
                },
              },
              {
                id: 'action',
                header: 'Next Action',
                cell: (row) => {
                  const nextAction = coverageNextAction(row)
                  return (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto px-0 font-normal"
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation()
                        runRowAction(row, nextAction.type)
                      }}
                    >
                      {nextAction.label}
                    </Button>
                  )
                },
              },
            ]}
          />

          <Typography variant="caption" tone="muted">
            Showing {filtered.length} of {rows.length} Requirements
          </Typography>
        </>
      )}

      <TestCoverageDetailDrawer
        key={`${selectedRequirementId ?? 'none'}-${openInLinkMode ? 'link' : 'summary'}`}
        open={Boolean(selectedRow)}
        row={selectedRow}
        initialMode={openInLinkMode ? 'link' : 'summary'}
        onClose={() => {
          setSelectedRequirementId(null)
          setOpenInLinkMode(false)
        }}
        loadLinkableTestCases={loadLinkableTestCases}
        onLink={async (requirementId, testCaseIds) => {
          await linkTestsToRequirement(requirementId, testCaseIds)
          await refetch()
        }}
        onOpenTestRuns={() => router.push(testRunsHref)}
        onOpenDefects={() => router.push(defectsHref)}
        onOpenTestCases={() => router.push(testCasesHref)}
        onOpenVerificationCases={() => router.push(verificationCasesHref)}
      />
    </div>
  )
}
