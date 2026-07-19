'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useSupportCases } from '../hooks/useSupportCases'
import { useSupportOps } from '../hooks/useSupportOps'

export function SupportDashboardView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, dashboard, loading, error } = useSupportCases(workspaceId)
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

  if (loading || opsLoading) return <PageSkeleton variant="cards" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>
  if (opsError) return <Typography tone="error">{opsError}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Support Center</Typography>
      <div className="grid grid-cols-3 gap-md">
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Open cases
          </Typography>
          <Typography variant="h3">{dashboard?.openCases ?? 0}</Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            SLA breached
          </Typography>
          <Typography variant="h3">{dashboard?.breachedSla ?? 0}</Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Incidents
          </Typography>
          <Typography variant="h3">{dashboard?.openIncidents ?? 0}</Typography>
        </div>
      </div>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <Typography variant="h4">Cases</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((c) => (
          <li key={c.id} className="p-md">
            <Link
              href={`/workspace/${workspaceId}/support/cases/${c.id}`}
              className="hover:underline"
            >
              <Typography variant="small" weight="medium">
                {c.title}
              </Typography>
            </Link>
            <Typography variant="caption" tone="muted">
              {[c.status, c.priority].filter(Boolean).join(' · ')}
            </Typography>
          </li>
        ))}
      </ul>

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
                  {i.title ?? i.id}
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
                  {p.title ?? p.id}
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
              {[m.name ?? m.id, m.status].filter(Boolean).join(' · ')}
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
