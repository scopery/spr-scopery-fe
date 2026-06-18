'use client'

import { Badge } from '@/shared/ui'
import type { DocumentWorkflowStatus } from '@/types/document'
import { DOCUMENT_WORKFLOW_STATUS_LABEL } from '@/types/document'

const TONE: Record<DocumentWorkflowStatus, 'neutral' | 'warning' | 'success'> = {
  draft: 'neutral',
  in_review: 'warning',
  approved: 'success',
}

interface WorkflowStatusBadgeProps {
  status: DocumentWorkflowStatus
  size?: 'sm' | 'md'
}

export function WorkflowStatusBadge({ status, size = 'sm' }: WorkflowStatusBadgeProps) {
  return (
    <Badge variant="soft" tone={TONE[status]} size={size}>
      {DOCUMENT_WORKFLOW_STATUS_LABEL[status]}
    </Badge>
  )
}
