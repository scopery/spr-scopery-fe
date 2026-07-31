'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useSupportCases } from '../hooks/useSupportCases'
import { useSupportOps } from '../hooks/useSupportOps'
import { CreateSupportCaseModal } from './CreateSupportCaseModal'

export function SupportDashboardView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, dashboard, loading, error, creating, createCase } = useSupportCases(workspaceId)
  const {
    incidents,
    problems,
    maintenancePlans,
    loading: opsLoading,
    error: opsError,
    actionError,
    acknowledgeIncident,
    resolveIncident,
    closeIncident,
    resolveProblem,
    closeProblem,
  } = useSupportOps(workspaceId)
  const [createOpen, setCreateOpen] = useState(false)

  if (loading || opsLoading)
    return <PageSkeleton variant="cards" className="px-3 py-3 lg:px-4 lg:py-3" />
  if (error) return <Typography tone="error">{error}</Typography>
  if (opsError) return <Typography tone="error">{opsError}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Typography as="h1" size="md" weight="medium">
          Support Center
        </Typography>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setCreateOpen(true)}
        >
          New case
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-md">
        <div className="border border-neutral-200 bg-white p-md">
          <Typography variant="caption" tone="muted">
            Open cases
          </Typography>
          <Typography size="md" weight="medium">
            {dashboard?.openCases ?? 0}
          </Typography>
        </div>
        <div className="border border-neutral-200 bg-white p-md">
          <Typography variant="caption" tone="muted">
            SLA breached
          </Typography>
          <Typography size="md" weight="medium">
            {dashboard?.breachedSla ?? 0}
          </Typography>
        </div>
        <div className="border border-neutral-200 bg-white p-md">
          <Typography variant="caption" tone="muted">
            Incidents
          </Typography>
          <Typography size="md" weight="medium">
            {dashboard?.openIncidents ?? 0}
          </Typography>
        </div>
      </div>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <Typography variant="h4">Cases</Typography>
      {items.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-white px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            No support cases yet.
          </Typography>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setCreateOpen(true)}>
            Create the first case
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((c) => (
            <li key={c.id} className="p-md">
              <Link
                href={`/workspace/${workspaceId}/support/cases/${c.id}`}
                className="hover:underline"
              >
                <Typography variant="small" weight="medium">
                  {c.caseNumber ? `${c.caseNumber} · ` : ''}
                  {c.title}
                </Typography>
              </Link>
              <Typography variant="caption" tone="muted">
                {[c.status, c.priority, c.requestTypeCode].filter(Boolean).join(' · ')}
              </Typography>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Incidents</Typography>
      {incidents.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No incidents.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {incidents.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {i.title ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[i.status, i.severity].filter(Boolean).join(' · ')}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void acknowledgeIncident(i.id)}>
                  Ack
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void resolveIncident(i.id)}>
                  Resolve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void closeIncident(i.id)}>
                  Close
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Problems</Typography>
      {problems.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No problems.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {problems.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {p.title ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {p.status}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void resolveProblem(p.id)}>
                  Resolve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void closeProblem(p.id)}>
                  Close
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Maintenance plans</Typography>
      {maintenancePlans.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No maintenance plans.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {maintenancePlans.map((m) => (
            <li key={m.id} className="p-md text-sm">
              {[m.name ?? '—', m.status].filter(Boolean).join(' · ')}
            </li>
          ))}
        </ul>
      )}

      <CreateSupportCaseModal
        workspaceId={workspaceId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        submitting={creating}
        onSubmit={createCase}
      />
    </Stack>
  )
}
