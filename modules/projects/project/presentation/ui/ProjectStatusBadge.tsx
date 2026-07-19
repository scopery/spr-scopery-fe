'use client'

import { Badge } from '@/shared/ui'
import {
  projectStatusLabel,
  projectStatusTone,
} from '../../domain/rules/project.rules'

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge key={status} variant="solid" tone={projectStatusTone(status)} className="motion-fade">
      {projectStatusLabel(status)}
    </Badge>
  )
}
