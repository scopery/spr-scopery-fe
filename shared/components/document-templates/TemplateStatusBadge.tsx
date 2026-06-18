'use client'

import { Badge } from '@/shared/ui'
import type { TemplateStatus } from '@/types/document-template'

const LABEL: Record<TemplateStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
}

const TONE: Record<TemplateStatus, 'neutral' | 'success' | 'warning' | 'error'> = {
  draft: 'neutral',
  published: 'success',
  archived: 'warning',
}

interface TemplateStatusBadgeProps {
  status: TemplateStatus
  isPublished?: boolean
  size?: 'sm' | 'md'
}

export function TemplateStatusBadge({ status, isPublished, size = 'sm' }: TemplateStatusBadgeProps) {
  const label =
    status === 'published' && isPublished === false ? 'Unpublished' : LABEL[status]
  return (
    <Badge variant="soft" tone={TONE[status] ?? 'neutral'} size={size}>
      {label}
    </Badge>
  )
}
