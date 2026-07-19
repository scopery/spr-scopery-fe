'use client'

import { Typography, Badge } from '@/shared/ui'
import { IamResourcesPanel } from './panels/IamResourcesPanel'

export function AdminIamResourcesView() {
  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Typography as="h1" size="lg" weight="semibold">
              Resources
            </Typography>
            <Badge tone="neutral">
              Developer tool
            </Badge>
          </div>
          <Typography as="p" variant="small" tone="muted">
            IAM resource registry. Resources are entities that can be granted access to via grants.
          </Typography>
        </div>
      </div>
      <IamResourcesPanel />
    </div>
  )
}
