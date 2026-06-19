'use client'

import { Badge } from '@/shared/ui'
import type { DeliverableReadinessStatus } from '@/modules/documents/deliverables'

const LABELS: Record<DeliverableReadinessStatus, string> = {
  ready: 'Ready',
  needs_review: 'Needs review',
  blocked: 'Blocked',
}

const TONES: Record<DeliverableReadinessStatus, 'success' | 'warning' | 'error'> = {
  ready: 'success',
  needs_review: 'warning',
  blocked: 'error',
}

interface DeliverableReadinessBadgeProps {
  status: DeliverableReadinessStatus | null
  warningCount?: number
}

export function DeliverableReadinessBadge({
  status,
  warningCount,
}: DeliverableReadinessBadgeProps) {
  if (!status) return null
  const label =
    status === 'needs_review' && warningCount != null && warningCount > 0
      ? `${LABELS[status]} (${warningCount})`
      : LABELS[status]

  return (
    <Badge variant="soft" tone={TONES[status]} size="sm">
      {label}
    </Badge>
  )
}
