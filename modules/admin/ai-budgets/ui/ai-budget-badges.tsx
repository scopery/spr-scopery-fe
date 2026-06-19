'use client'

import { formatEstimatedCost } from '@/modules/admin/ai-agents/ui/ai-agent-badges'
import type { AIBudgetStatusLabel } from '../model/ai-budget'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<AIBudgetStatusLabel, string> = {
  ok: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  exceeded: 'bg-red-50 text-red-700 border-red-200',
  inactive: 'bg-neutral-100 text-neutral-600 border-neutral-200',
}

const STATUS_LABELS: Record<AIBudgetStatusLabel, string> = {
  ok: 'OK',
  warning: 'Warning',
  exceeded: 'Exceeded',
  inactive: 'Inactive',
}

export function AIBudgetStatusBadge({ status }: { status: AIBudgetStatusLabel }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

export function formatUsagePercent(value: number | null): string {
  if (value == null) return '—'
  return `${value.toFixed(0)}%`
}

export function formatBudgetAmount(value: number | null, currency = 'USD'): string {
  if (value == null) return '—'
  return formatEstimatedCost(value, currency)
}
