'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Button, DataTable, Input, PageSkeleton, Select, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { qualityCasesHref } from '@/modules/quality'
import { useUseCaseCoverage } from '../hooks/useUseCaseCoverage'
import { StatusBadge } from './TraceabilityStatusBits'
import { NextActionLink, useCaseCoverageActionHref } from './NextActionLink'

interface UseCaseCoverageTabProps {
  projectId: string
  initialFilter?: string | null
}

export function UseCaseCoverageTab({ projectId, initialFilter }: UseCaseCoverageTabProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [coverageStatus, setCoverageStatus] = useState(
    initialFilter === 'MISSING_TEST' ? 'PARTIAL' : ''
  )
  const [offset, setOffset] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const limit = 50

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim())
      setOffset(0)
    }, 250)
    return () => window.clearTimeout(t)
  }, [q])

  const query = useMemo(
    () => ({
      q: debouncedQ || undefined,
      coverageStatus: coverageStatus || undefined,
      limit,
      offset,
    }),
    [debouncedQ, coverageStatus, offset]
  )

  const { data, loading, error, refetch } = useUseCaseCoverage(projectId, query)
  const items = data?.items ?? []

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-52">
          <Input
            fullWidth
            size="sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search use cases…"
            prefix={<Search size={14} />}
          />
        </div>
        <div className="w-44">
          <Select
            size="sm"
            value={coverageStatus}
            onValueChange={(value: string) => {
              setCoverageStatus(value)
              setOffset(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'PARTIAL', label: 'Partial' },
              { value: 'COMPLETE', label: 'Complete' },
              { value: 'NOT_APPLICABLE', label: 'Not applicable' },
            ]}
            aria-label="Coverage status"
          />
        </div>
      </div>

      {loading ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <div>
          <Typography tone="error">{error}</Typography>
          <Button className="mt-2" size="sm" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {!loading && !error ? (
        <DataTable
          className="border border-neutral-200 bg-white"
          ariaLabel="Use case coverage"
          rows={items}
          rowKey={(row) => row.useCaseId}
          emptyMessage="No use cases found."
          columns={[
            {
              id: 'uc',
              header: 'Use Case',
              cell: (row) => (
                <div className="flex min-w-0 items-start gap-1.5">
                  <button
                    type="button"
                    className="-ml-0.5 shrink-0 p-0.5 text-neutral-500"
                    aria-label={expanded === row.useCaseId ? 'Collapse' : 'Expand'}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpanded((id) => (id === row.useCaseId ? null : row.useCaseId))
                    }}
                  >
                    {expanded === row.useCaseId ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  <div className="min-w-0">
                    <Link
                      href={`${ROUTES.workspace.projectUseCases(workspaceId, projectId)}?useCaseId=${row.useCaseId}`}
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.key}
                    </Link>
                    <Typography variant="small" tone="muted" className="line-clamp-1">
                      {row.name}
                    </Typography>
                  </div>
                </div>
              ),
            },
            {
              id: 'fn',
              header: 'Parent Function',
              cell: (row) =>
                row.parentFunctionCode ? (
                  <span className="text-sm">
                    {row.parentFunctionCode} · {row.parentFunctionName}
                  </span>
                ) : (
                  <span className="text-sm text-neutral-400">—</span>
                ),
            },
            {
              id: 'spec',
              header: 'Specification',
              cell: (row) => <StatusBadge status={row.specificationStatus} />,
            },
            {
              id: 'ac',
              header: 'AC / Tests',
              cell: (row) => (
                <span className="text-sm tabular-nums">
                  {row.acceptanceCriteriaCount} criteria · {row.testCaseCount} test cases
                  {row.latestResult ? ` · ${row.latestResult}` : ''}
                </span>
              ),
            },
            {
              id: 'status',
              header: 'Coverage',
              cell: (row) => <StatusBadge status={row.coverageStatus} />,
            },
            {
              id: 'action',
              header: 'Next action',
              cell: (row) => (
                <NextActionLink
                  href={useCaseCoverageActionHref(
                    workspaceId,
                    projectId,
                    row.useCaseId,
                    row.nextAction,
                    ROUTES.workspace,
                    qualityCasesHref
                  )}
                  label={row.nextAction}
                />
              ),
            },
          ]}
        />
      ) : null}

      {expanded
        ? items
            .filter((r) => r.useCaseId === expanded)
            .map((row) => (
              <div
                key={`exp-${row.useCaseId}`}
                className="space-y-3 border border-t-0 border-neutral-200 bg-neutral-50 px-3 py-2.5"
              >
                <div>
                  <Typography variant="small" weight="medium" className="mb-1">
                    Acceptance criteria
                  </Typography>
                  {row.acceptanceCriteria.length === 0 ? (
                    <Typography variant="small" tone="muted">
                      No acceptance criteria yet.
                    </Typography>
                  ) : (
                    <ul className="space-y-1">
                      {row.acceptanceCriteria.map((ac) => (
                        <li key={ac.id} className="text-xs text-neutral-700">
                          <span className={ac.hasTestCase ? 'text-success' : 'text-warning'}>
                            {ac.hasTestCase ? '●' : '○'}
                          </span>{' '}
                          Given {ac.givenText || '…'} / When {ac.whenText || '…'} / Then{' '}
                          {ac.thenText || '…'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <Typography variant="small" weight="medium" className="mb-1">
                    Linked test cases
                  </Typography>
                  {row.testCases.length === 0 ? (
                    <Typography variant="small" tone="muted">
                      No test cases — create or link from Quality Cases.
                    </Typography>
                  ) : (
                    <ul className="space-y-1">
                      {row.testCases.map((tc) => (
                        <li key={tc.id}>
                          <Link
                            href={qualityCasesHref(workspaceId, projectId, {
                              type: 'functional',
                              selected: tc.id,
                            })}
                            className="text-xs text-primary hover:underline"
                          >
                            {tc.code} · {tc.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
        : null}
    </div>
  )
}
