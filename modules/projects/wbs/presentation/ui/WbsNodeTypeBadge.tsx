'use client'

import { Badge } from '@/shared/ui'
import {
  wbsNodeTypeBadgeTone,
  wbsNodeTypeLabel,
} from '../../domain/rules/wbs.rules'

type Props = {
  nodeType: string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

export function WbsNodeTypeBadge({ nodeType, size = 'sm', className }: Props) {
  if (!nodeType) return null
  return (
    <Badge
      tone={wbsNodeTypeBadgeTone(nodeType)}
      variant="solid"
      size={size}
      className={className}
    >
      {wbsNodeTypeLabel(nodeType)}
    </Badge>
  )
}
