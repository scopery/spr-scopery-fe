'use client'

import { Badge } from '@/shared/ui'
import type { DocumentVisibility } from '@/modules/documents/document'

const LABEL: Record<DocumentVisibility, string> = {
  private: 'Private',
  workspace: 'Workspace',
  project: 'Project',
  shared: 'Shared',
}

interface DocumentVisibilityBadgeProps {
  visibility: DocumentVisibility
  size?: 'sm' | 'md'
}

export function DocumentVisibilityBadge({ visibility, size = 'sm' }: DocumentVisibilityBadgeProps) {
  return (
    <Badge variant="outline" tone="neutral" size={size}>
      {LABEL[visibility]}
    </Badge>
  )
}
