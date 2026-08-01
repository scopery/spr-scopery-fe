'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button, DataTable, Input, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useImplementationCoverage } from '../hooks/useImplementationCoverage'
import { StatusBadge } from './TraceabilityStatusBits'
import { NextActionLink, implementationActionHref } from './NextActionLink'

interface ImplementationCoverageTabProps {
  projectId: string
}

export function ImplementationCoverageTab({ projectId }: ImplementationCoverageTabProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 50

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim())
      setOffset(0)
    }, 250)
    return () => window.clearTimeout(t)
  }, [q])

  const query = useMemo(
    () => ({ q: debouncedQ || undefined, limit, offset }),
    [debouncedQ, offset]
  )
  const { data, loading, error, refetch } = useImplementationCoverage(projectId, query)

  return (
    <div className="space-y-3">
      <Typography variant="small" tone="muted">
        Screens, APIs, and related implementation objects per Function.
      </Typography>
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
          ariaLabel="Implementation coverage"
          rows={data?.items ?? []}
          rowKey={(row) => row.functionId}
          emptyMessage="No functions found."
          columns={[
            {
              id: 'fn',
              header: 'Function',
              cell: (row) => (
                <div>
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
              ),
            },
            {
              id: 'counts',
              header: 'Artifacts',
              cell: (row) => (
                <span className="text-sm tabular-nums">
                  {row.screenCount} screens · {row.apiCount} APIs · {row.componentCount} components
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
                  href={implementationActionHref(
                    workspaceId,
                    projectId,
                    row.functionId,
                    ROUTES.workspace
                  )}
                  label={row.nextAction}
                />
              ),
            },
          ]}
        />
      ) : null}
    </div>
  )
}
