'use client'

import { Typography } from '@/shared/ui'
import type { AIUsageSummary } from '@/modules/admin/ai-agents'
import { formatEstimatedCost, formatTokens } from './ai-agent-badges'

interface AIAgentUsageSummaryCardsProps {
  summary: AIUsageSummary
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <Typography variant="xs" className="mb-1 uppercase text-neutral-500">
        {label}
      </Typography>
      <Typography variant="lg" className="font-semibold text-neutral-900">
        {value}
      </Typography>
    </div>
  )
}

export function AIAgentUsageSummaryCards({ summary }: AIAgentUsageSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard label="Total runs" value={summary.totalRuns.toLocaleString()} />
      <MetricCard
        label="Successful / Failed"
        value={`${summary.successfulRuns} / ${summary.failedRuns}`}
      />
      <MetricCard label="Total tokens" value={formatTokens(summary.totalTokens)} />
      <MetricCard
        label="Estimated cost"
        value={formatEstimatedCost(summary.totalEstimatedCost, summary.currency)}
      />
      <MetricCard
        label="Avg latency"
        value={
          summary.averageLatencyMs != null ? `${Math.round(summary.averageLatencyMs)} ms` : '—'
        }
      />
      <MetricCard
        label="Avg tokens / run"
        value={summary.averageTokensPerRun != null ? summary.averageTokensPerRun.toFixed(1) : '—'}
      />
      <MetricCard
        label="Avg cost / run"
        value={
          summary.averageCostPerRun != null
            ? formatEstimatedCost(summary.averageCostPerRun, summary.currency)
            : 'Pricing not configured'
        }
      />
      <MetricCard
        label="Most recent run"
        value={
          summary.mostRecentRunAt
            ? new Date(summary.mostRecentRunAt).toLocaleString()
            : 'No runs yet'
        }
      />
    </div>
  )
}
