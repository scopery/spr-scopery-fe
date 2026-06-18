'use client'

import { Badge } from '@/shared/ui'
import type { AIAgentStatus, AIAgentVersionStatus } from '@/types/ai-agent-control'

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

function versionStatusTone(status: AIAgentVersionStatus): 'info' | 'success' | 'neutral' | 'warning' {
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

export function AIAgentStatusBadge({ status }: { status: AIAgentStatus }) {
  return (
    <Badge tone={agentStatusTone(status)} size="sm">
      {status}
    </Badge>
  )
}

export function AIAgentVersionStatusBadge({ status }: { status: AIAgentVersionStatus }) {
  return (
    <Badge tone={versionStatusTone(status)} size="sm">
      {status}
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
