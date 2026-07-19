'use client'

import { Badge } from '@/shared/ui'
import type { AIAgentStatus, AIAgentVersionStatus } from '../../domain/enums/ai-agent-control.enum'

function agentStatusTone(status: AIAgentStatus): 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'neutral'
    case 'deprecated':
      return 'warning'
    default:
      return 'neutral'
  }
}

function versionStatusTone(
  status: AIAgentVersionStatus
): 'info' | 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'draft':
      return 'info'
    case 'testing':
      return 'warning'
    case 'published':
      return 'success'
    case 'archived':
      return 'neutral'
    default:
      return 'neutral'
  }
}

function formatStatusLabel(status: string) {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AIAgentStatusBadge({ status }: { status: AIAgentStatus }) {
  return (
    <Badge variant="solid" tone={agentStatusTone(status)}>
      {formatStatusLabel(status)}
    </Badge>
  )
}

export function AIAgentVersionStatusBadge({ status }: { status: AIAgentVersionStatus }) {
  return (
    <Badge variant="solid" tone={versionStatusTone(status)}>
      {formatStatusLabel(status)}
    </Badge>
  )
}

export function formatEstimatedCost(cost: number | null, currency: string | null): string {
  if (cost == null) return 'Pricing not configured'
  const code = currency ?? 'USD'
  return `${code} ${cost.toFixed(4)}`
}

export function formatTokens(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString()
}
