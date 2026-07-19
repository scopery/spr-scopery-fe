'use client'

import { Typography, Badge } from '@/shared/ui'
import { IamRightsPanel } from './panels/IamRightsPanel'

export function AdminIamRightsView() {
  return (
    <div>
      <div className="mb-6 flex items-start gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Typography as="h1" size="lg" weight="semibold">
              Rights
            </Typography>
            <Badge tone="neutral">
              Developer tool
            </Badge>
          </div>
          <Typography as="p" variant="small" tone="muted">
            Raw IAM rights registry. For a business-friendly view, see the{' '}
            <a href="/admin/iam/permissions" className="text-primary underline">
              Permission Catalog
            </a>
            .
          </Typography>
        </div>
      </div>
      <IamRightsPanel />
    </div>
  )
}
