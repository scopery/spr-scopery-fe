'use client'

import { Typography } from '@/shared/ui'
import type { DeliverableReadinessWarningsProps } from '../model/deliverables'

export function DeliverableReadinessWarnings({ readiness }: DeliverableReadinessWarningsProps) {
  if (!readiness) return null

  return (
    <div className="space-y-2">
      <Typography variant="small" className="font-medium">
        Review readiness — {readiness.readiness_status.replace('_', ' ')}
      </Typography>
      {readiness.blocking_issues.length > 0 ? (
        <ul className="text-destructive space-y-1 text-sm">
          {readiness.blocking_issues.map((issue) => (
            <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
      {readiness.warnings.length > 0 ? (
        <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
          {readiness.warnings.map((warning) => (
            <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
          ))}
        </ul>
      ) : null}
      {readiness.suggested_actions.length > 0 ? (
        <ul className="text-muted-foreground space-y-1 text-xs">
          {readiness.suggested_actions.map((action) => (
            <li key={action.action}>Suggested: {action.label}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
