'use client'

import { Badge } from '@/shared/ui'
import { TEMPLATE_CATEGORY_LABEL } from '@/modules/documents/document-templates'

interface TemplateCategoryBadgeProps {
  category: string | null
  size?: 'sm' | 'md'
}

export function TemplateCategoryBadge({ category, size = 'sm' }: TemplateCategoryBadgeProps) {
  if (!category) return null
  const label = TEMPLATE_CATEGORY_LABEL[category] ?? category
  return (
    <Badge variant="soft" tone="neutral" size={size}>
      {label}
    </Badge>
  )
}
