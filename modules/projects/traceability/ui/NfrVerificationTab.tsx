'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button, DataTable, Input, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { qualityCasesHref } from '@/modules/quality'
import { useNfrVerification } from '../hooks/useNfrVerification'
import { StatusBadge } from './TraceabilityStatusBits'
import { NextActionLink, nfrActionHref } from './NextActionLink'

interface NfrVerificationTabProps {
  projectId: string
}

export function NfrVerificationTab({ projectId }: NfrVerificationTabProps) {
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
  const { data, loading, error, refetch } = useNfrVerification(projectId, query)

  return (
    <div className="space-y-3">
      <Typography variant="small" tone="muted">
        Non-functional requirements: specification, targets, verification cases, and results.
      </Typography>
      <div className="w-52">
        <Input
          fullWidth
          size="sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search NFRs…"
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
          ariaLabel="NFR verification"
          rows={data?.items ?? []}
          rowKey={(row) => row.requirementId}
          emptyMessage="No NFR requirements found."
          columns={[
            {
              id: 'req',
              header: 'Requirement',
              cell: (row) => (
                <div>
                  <Link
                    href={`${ROUTES.workspace.projectRequirements(workspaceId, projectId)}?requirementId=${row.requirementId}`}
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
              id: 'attr',
              header: 'Attribute',
              cell: (row) => (
                <span className="text-sm">{row.qualityAttribute ?? '—'}</span>
              ),
            },
            {
              id: 'counts',
              header: 'Targets / Cases',
              cell: (row) => (
                <span className="text-sm tabular-nums">
                  {row.targetCount} targets · {row.verificationCaseCount} cases
                </span>
              ),
            },
            {
              id: 'result',
              header: 'Latest result',
              cell: (row) => (
                <span className="text-sm">{row.latestResult ?? row.latestMeasurement ?? '—'}</span>
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
                  href={nfrActionHref(
                    workspaceId,
                    projectId,
                    row.requirementId,
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
    </div>
  )
}
