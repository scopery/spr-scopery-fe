'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { Button, DataTable, Input, PageSkeleton, Select, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { useFunctionCoverage } from '../hooks/useFunctionCoverage'
import { StatusBadge } from './TraceabilityStatusBits'
import { NextActionLink, functionCoverageActionHref } from './NextActionLink'

interface FunctionCoverageTabProps {
  projectId: string
  initialFilter?: string | null
}

export function FunctionCoverageTab({ projectId, initialFilter }: FunctionCoverageTabProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [coverageStatus, setCoverageStatus] = useState(
    initialFilter === 'MISSING_USE_CASE' ? 'PARTIAL' : ''
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

  const { data, loading, error, refetch } = useFunctionCoverage(projectId, query)
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
            placeholder="Search functions…"
            prefix={<Search size={14} />}
          />
        </div>
        <div className="w-44">
          <Select
            size="sm"
            value={coverageStatus}
            onValueChange={(value) => {
              setCoverageStatus(value)
              setOffset(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'NOT_MAPPED', label: 'Not mapped' },
              { value: 'PARTIAL', label: 'Partial' },
              { value: 'COMPLETE', label: 'Complete' },
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
          ariaLabel="Function coverage"
          rows={items}
          rowKey={(row) => row.functionId}
          emptyMessage="No functions found."
          columns={[
            {
              id: 'function',
              header: 'Function',
              cell: (row) => (
                <div className="flex min-w-0 items-start gap-1.5">
                  <button
                    type="button"
                    className="-ml-0.5 shrink-0 p-0.5 text-neutral-500"
                    aria-label={expanded === row.functionId ? 'Collapse' : 'Expand'}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpanded((id) => (id === row.functionId ? null : row.functionId))
                    }}
                  >
                    {expanded === row.functionId ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  <div className="min-w-0">
                    <Link
                      href={`${ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)}?fr=${row.functionId}`}
                      className="text-sm text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.code}
                    </Link>
                    <Typography variant="small" tone="muted" className="line-clamp-1">
                      {row.title}
                    </Typography>
                  </div>
                </div>
              ),
            },
            {
              id: 'reqs',
              header: 'Requirements',
              cell: (row) => (
                <span className="text-sm tabular-nums">
                  {row.requirementsCoveredByUseCases}/{row.linkedRequirementCount} Reqs with UC
                </span>
              ),
            },
            {
              id: 'ucs',
              header: 'Use Cases',
              cell: (row) => (
                <span className="text-sm tabular-nums">
                  {row.specificationReadyCount}/{row.useCaseCount} UCs ready ·{' '}
                  {row.testedUseCaseCount} with Test
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
              cell: (row) => {
                const coverRemaining = row.nextAction.toLowerCase().includes('cover remaining')
                if (coverRemaining) {
                  return (
                    <NextActionLink
                      href={null}
                      label={row.nextAction}
                      onClick={() => setExpanded(row.functionId)}
                    />
                  )
                }
                return (
                  <NextActionLink
                    href={functionCoverageActionHref(
                      workspaceId,
                      projectId,
                      row.functionId,
                      row.nextAction,
                      ROUTES.workspace
                    )}
                    label={row.nextAction}
                  />
                )
              },
            },
          ]}
        />
      ) : null}

      {expanded
        ? items
            .filter((r) => r.functionId === expanded)
            .map((row) => (
              <div
                key={`exp-${row.functionId}`}
                className="border border-t-0 border-neutral-200 bg-neutral-50 px-3 py-2.5"
              >
                <Typography variant="small" weight="medium" className="mb-2">
                  Requirements × covering Use Cases
                </Typography>
                {row.requirementCovers.length === 0 ? (
                  <Typography variant="small" tone="muted">
                    No linked requirements. Link requirements to this function.
                  </Typography>
                ) : (
                  <ul className="space-y-2">
                    {row.requirementCovers.map((rc) => (
                      <li key={rc.requirementId} className="text-xs">
                        <span className={cn('font-medium', !rc.covered && 'text-error')}>
                          {rc.code} · {rc.title}
                        </span>
                        <span className="ml-2 text-neutral-500">
                          {rc.covered
                            ? `covered by ${rc.coveringUseCases.map((u) => u.code).join(', ')}`
                            : 'no covering Use Case — create or link UC'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
        : null}

      {(data?.page.total ?? 0) > limit ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={offset + limit >= (data?.page.total ?? 0)}
            onClick={() => setOffset((o) => o + limit)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}
