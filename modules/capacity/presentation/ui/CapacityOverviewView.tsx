'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { RefreshCw, Users } from 'lucide-react'
import {
  Badge,
  Button,
  FinancialKpiStrip,
  Input,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useCapacityOverview } from '../hooks/useCapacityOverview'
import { formatHours, formatPercent } from '../../domain/rules/capacity.rules'

function AttentionStrip({
  items,
}: {
  items: Array<{ id: string; severity: string; label: string; count?: number }>
}) {
  if (items.length === 0) return null
  return (
    <div className="mb-4 flex flex-wrap gap-sm" role="status">
      {items.map((item) => (
        <Badge
          key={item.id}
          size="sm"
          tone={
            item.severity === 'critical'
              ? 'error'
              : item.severity === 'warning'
                ? 'warning'
                : 'info'
          }
        >
          {item.label}
          {item.count != null ? ` (${item.count})` : ''}
        </Badge>
      ))}
    </div>
  )
}

export function CapacityOverviewView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    overview,
    overAllocations,
    hasResources,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    loading,
    error,
    syncing,
    refetch,
    syncFromMembers,
  } = useCapacityOverview(workspaceId)

  if (loading && !overview) return <PageSkeleton variant="cards" />

  if (error) {
    return (
      <div className="border border-error/30 bg-error/5 p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  if (!hasResources) {
    return (
      <div>
        <div className="mb-6">
          <Typography as="h1" size="lg" weight="semibold">
            Capacity Overview
          </Typography>
        </div>
        <div className="border border-neutral-200 bg-white px-6 py-12 text-center">
          <Typography weight="semibold" className="mb-2">
            No resources are available for capacity planning.
          </Typography>
          <Typography variant="small" tone="muted" className="mb-6">
            Sync workspace members or create resource profiles to get started.
          </Typography>
          <div className="flex flex-wrap justify-center gap-sm">
            <Button
              variant="primary"
              loading={syncing}
              icon={<Users size={16} />}
              onClick={() => void syncFromMembers()}
            >
              Sync from workspace members
            </Button>
            <Button
              as={NextLink}
              href={ROUTES.workspace.capacityResources(workspaceId)}
              variant="secondary"
            >
              Create resource
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const kpiItems = [
    {
      id: 'available',
      label: 'Available capacity',
      value: <Typography weight="semibold">{formatHours(overview?.availableCapacityHours)}</Typography>,
      footnote: `${fromDate} → ${toDate}`,
    },
    {
      id: 'focused',
      label: 'Focused capacity',
      value: <Typography weight="semibold">{formatHours(overview?.focusedCapacityHours)}</Typography>,
    },
    {
      id: 'allocated',
      label: 'Allocated',
      value: <Typography weight="semibold">{formatHours(overview?.allocatedHours)}</Typography>,
    },
    {
      id: 'remaining',
      label: 'Remaining',
      value: (
        <Typography weight="semibold">{formatHours(overview?.remainingCapacityHours)}</Typography>
      ),
    },
    {
      id: 'over',
      label: 'Over-allocated',
      value: (
        <Typography weight="semibold">
          {overview?.overAllocatedResourceCount ?? overAllocations.length}
        </Typography>
      ),
    },
    {
      id: 'util',
      label: 'Utilization',
      value: (
        <Typography weight="semibold">{formatPercent(overview?.utilizationPercent)}</Typography>
      ),
    },
  ]

  const periods = overview?.periods ?? []

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Capacity Overview
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Capacity vs demand, utilization, and attention for this workspace.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          <Button
            as={NextLink}
            href={ROUTES.workspace.capacityResources(workspaceId)}
            variant="secondary"
          >
            Resources
          </Button>
          <Button
            as={NextLink}
            href={ROUTES.workspace.capacityAllocations(workspaceId)}
            variant="primary"
          >
            Open Allocation Planner
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-sm">
        <Input
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Button
          variant="secondary"
          icon={<RefreshCw size={14} />}
          loading={loading}
          onClick={() => void refetch()}
        >
          Refresh
        </Button>
      </div>

      <AttentionStrip items={overview?.attention ?? []} />

      <div className="mb-6">
        <FinancialKpiStrip items={kpiItems} mode="expanded" aria-label="Capacity KPIs" />
      </div>

      <section className="mb-6 border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-3">
          <Typography weight="semibold" variant="small">
            Capacity vs demand
          </Typography>
          <Typography variant="caption" tone="muted">
            Table view (chart can be added when period series is stable).
          </Typography>
        </div>
        {periods.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Typography tone="muted" variant="small">
              No period breakdown for this range. Adjust dates or rebuild capacity.
            </Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 font-medium">Available</th>
                  <th className="px-3 py-2 font-medium">Focused</th>
                  <th className="px-3 py-2 font-medium">Allocated</th>
                  <th className="px-3 py-2 font-medium">Surplus / Shortage</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.period} className="border-t border-neutral-100">
                    <td className="px-3 py-2">{p.period}</td>
                    <td className="px-3 py-2">{formatHours(p.availableHours)}</td>
                    <td className="px-3 py-2">{formatHours(p.focusedHours)}</td>
                    <td className="px-3 py-2">{formatHours(p.allocatedHours)}</td>
                    <td className="px-3 py-2">
                      <Typography
                        as="span"
                        variant="small"
                        tone={p.surplusHours < 0 ? 'error' : 'success'}
                      >
                        {formatHours(p.surplusHours)}
                      </Typography>
                    </td>
                    <td className="px-3 py-2">
                      {p.status ? (
                        <Badge size="sm" tone="neutral">
                          {p.status}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-4 py-3">
          <Typography weight="semibold" variant="small">
            Over-allocations ({overAllocations.length})
          </Typography>
        </div>
        {overAllocations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Typography tone="muted" variant="small">
              No over-allocations in this period.
            </Typography>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Resource</th>
                  <th className="px-3 py-2 font-medium">Project</th>
                  <th className="px-3 py-2 font-medium">Allocated %</th>
                  <th className="px-3 py-2 font-medium">Hours</th>
                  <th className="px-3 py-2 font-medium">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {overAllocations.map((row, i) => (
                  <tr
                    key={`${row.resourceProfileId ?? 'r'}-${row.projectId ?? 'p'}-${i}`}
                    className="border-t border-neutral-100"
                  >
                    <td className="px-3 py-2">
                      {row.resourceDisplayName ?? row.resourceProfileId?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {row.projectName ?? row.projectId?.slice(0, 8) ?? '—'}
                    </td>
                    <td className="px-3 py-2">{formatPercent(row.allocatedPercent)}</td>
                    <td className="px-3 py-2">
                      {formatHours(row.allocatedHours)} / {formatHours(row.availableHours)}
                    </td>
                    <td className="px-3 py-2">{formatPercent(row.utilizationPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
