'use client'

import { Badge } from '@/shared/ui'
import { TEMPLATE_SCOPE_LABEL, type TemplateScope } from '@/types/document-template'

const TONE_MAP: Record<TemplateScope, 'neutral' | 'info' | 'primary' | 'success'> = {
  system: 'info',
  personal: 'primary',
  workspace: 'success',
  project: 'neutral',
}

interface TemplateScopeBadgeProps {
  scope: TemplateScope
  size?: 'sm' | 'md'
}

export function TemplateScopeBadge({ scope, size = 'sm' }: TemplateScopeBadgeProps) {
  return (
    <Badge variant="soft" tone={TONE_MAP[scope] ?? 'neutral'} size={size}>
      {TEMPLATE_SCOPE_LABEL[scope]}
    </Badge>
  )
}
