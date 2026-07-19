'use client'

import { Typography } from '@/shared/ui'

/** Activity feed list API is not exposed for org/workspace scope yet. */
export function OrganizationActivityPanel({ scopeLabel }: { scopeLabel: string }) {
  return (
    <div className="border border-neutral-200 bg-neutral-50 p-6">
      <Typography as="h2" size="lg" weight="bold" className="mb-2">
        Activity
      </Typography>
      <Typography variant="small" tone="muted">
        A dedicated {scopeLabel} activity feed API is not available yet. Platform audit events remain
        under Admin → IAM → Audit for operators with system access.
      </Typography>
    </div>
  )
}
