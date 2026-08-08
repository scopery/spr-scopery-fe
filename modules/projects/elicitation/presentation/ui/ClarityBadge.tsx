import { Badge, type BadgeTone } from '@/shared/ui'
import { ClarityLevel } from '../../domain/enums/elicitation.enum'

const CLARITY_TONE: Record<string, BadgeTone> = {
  [ClarityLevel.Blocked]: 'error',
  [ClarityLevel.Critical]: 'error',
  [ClarityLevel.Important]: 'warning',
  [ClarityLevel.Minor]: 'info',
  [ClarityLevel.Cleared]: 'success',
}

const CLARITY_LABEL: Record<string, string> = {
  [ClarityLevel.Blocked]: 'Blocked',
  [ClarityLevel.Critical]: 'Critical',
  [ClarityLevel.Important]: 'Important',
  [ClarityLevel.Minor]: 'Minor',
  [ClarityLevel.Cleared]: 'Cleared',
}

interface ClarityBadgeProps {
  clarityLevel: string | null | undefined
}

export function ClarityBadge({ clarityLevel }: ClarityBadgeProps) {
  if (!clarityLevel) return null
  return (
    <Badge tone={CLARITY_TONE[clarityLevel] ?? 'neutral'} size="sm">
      {CLARITY_LABEL[clarityLevel] ?? clarityLevel}
    </Badge>
  )
}
