'use client'

import { Typography } from '@/shared/ui'
import type { DeliverableReadinessWarningsProps } from '../model/deliverables'

export function DeliverableReadinessWarnings({ readiness }: DeliverableReadinessWarningsProps) {
  if (!readiness) return null

  return (
    <div className="space-y-2">
      <Typography variant="small" weight="medium">
        Review readiness — {readiness.readiness_status.replace('_', ' ')}
      </Typography>
      {readiness.blocking_issues.length > 0 ? (
        <Typography as="ul" variant="small" tone="error" className="space-y-1">
          {readiness.blocking_issues.map((issue) => (
            <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
          ))}
        </Typography>
      ) : null}
      {readiness.warnings.length > 0 ? (
        <Typography as="ul" variant="small" className="space-y-1 text-amber-700 dark:text-amber-400">
          {readiness.warnings.map((warning) => (
            <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
          ))}
        </Typography>
      ) : null}
      {readiness.suggested_actions.length > 0 ? (
        <Typography as="ul" variant="small" size="xs" tone="muted" className="space-y-1">
          {readiness.suggested_actions.map((action) => (
            <li key={action.action}>Suggested: {action.label}</li>
          ))}
        </Typography>
      ) : null}
    </div>
  )
}
