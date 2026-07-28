'use client'

import NextLink from 'next/link'
import { Badge, Button, Typography } from '@/shared/ui'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import type { CapacityOverview, OverAllocationItem } from '@/modules/capacity/domain/model/capacity-overview'
import { cn } from '@/utils/cn'

interface WorkspaceCapacityWidgetProps {
  workspaceId: string
  overview: CapacityOverview | null
  overAllocations: OverAllocationItem[]
  loading?: boolean
  forbidden?: boolean
}

function utilizationTone(pct: number | null | undefined) {
  if (pct == null) return 'bg-neutral-100 text-neutral-600'
  if (pct >= 110) return 'bg-error/15 text-error'
  if (pct >= 95) return 'bg-warning/15 text-warning-800'
  return 'bg-success/10 text-success-800'
}

export function WorkspaceCapacityWidget({
  workspaceId,
  overview,
  overAllocations,
  loading,
  forbidden,
}: WorkspaceCapacityWidgetProps) {
  const periods = overview?.periods ?? []
  const overCount = overview?.overAllocatedResourceCount ?? overAllocations.length

  return (
    <section id="team-capacity" className="border border-neutral-200 bg-white">
      <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
        <div>
          <Typography as="h2" size="sm" weight="semibold">
            Team capacity
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Next periods · utilization vs demand
          </Typography>
        </div>
        <Button as={NextLink} href={WORKSPACE_ROUTES.capacity(workspaceId)} variant="ghost" size="sm">
          Open Workload
        </Button>
      </header>

      {forbidden ? (
        <div className="px-4 py-8 text-center">
          <Typography variant="small" tone="muted">
            You do not have permission to view capacity.
          </Typography>
        </div>
      ) : loading && !overview ? (
        <div className="space-y-2 px-4 py-6" aria-busy="true">
          <div className="h-4 w-1/2 bg-neutral-100" />
          <div className="h-12 w-full bg-neutral-50" />
        </div>
      ) : (
        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <Typography variant="small" tone="muted">
                Utilization
              </Typography>
              <Typography weight="semibold" className="tabular-nums">
                {overview?.utilizationPercent != null
                  ? `${Math.round(overview.utilizationPercent)}%`
                  : '—'}
              </Typography>
            </div>
            <div>
              <Typography variant="small" tone="muted">
                Over-allocated
              </Typography>
              <Typography weight="semibold" className="tabular-nums">
                {overCount}
              </Typography>
            </div>
          </div>

          {periods.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {periods.slice(0, 8).map((p) => {
                const pct =
                  p.availableHours > 0
                    ? Math.round((p.allocatedHours / p.availableHours) * 100)
                    : null
                return (
                  <div
                    key={p.period}
                    className={cn('min-w-[72px] border border-neutral-200 px-2 py-2', utilizationTone(pct))}
                  >
                    <Typography variant="small" className="block text-xs opacity-80">
                      {p.period}
                    </Typography>
                    <Typography weight="semibold" className="tabular-nums">
                      {pct != null ? `${pct}%` : '—'}
                    </Typography>
                  </div>
                )
              })}
            </div>
          ) : (
            <Typography variant="small" tone="muted">
              Period breakdown unavailable for this range.
            </Typography>
          )}

          {overAllocations.length > 0 ? (
            <div>
              <Typography variant="small" weight="medium" className="mb-2">
                Overloaded resources
              </Typography>
              <ul className="space-y-2">
                {overAllocations.slice(0, 5).map((row, i) => (
                  <li
                    key={`${row.resourceProfileId ?? 'r'}-${row.projectId ?? 'p'}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <Typography variant="small" weight="medium">
                        {row.resourceDisplayName ?? 'Resource'}
                      </Typography>
                      <Typography variant="small" tone="muted">
                        {row.projectName ?? 'Multiple projects'}
                      </Typography>
                    </div>
                    <Badge variant="solid" tone="error" size="sm">
                      {row.utilizationPercent != null
                        ? `${Math.round(row.utilizationPercent)}%`
                        : 'Over'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
