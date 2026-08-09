import { Badge, type BadgeTone } from '@/shared/ui'
import { ClarityLevel } from '../../domain/enums/elicitation.enum'

const CLARITY_LABEL: Record<string, string> = {
  [ClarityLevel.Blocked]: 'Blocked',
  [ClarityLevel.Critical]: 'Critical',
  [ClarityLevel.Important]: 'Important',
  [ClarityLevel.Minor]: 'Minor',
  [ClarityLevel.Cleared]: 'Cleared',
}

const CLARITY_TONE: Record<string, BadgeTone> = {
  [ClarityLevel.Blocked]: 'error',
  [ClarityLevel.Critical]: 'error',
  [ClarityLevel.Important]: 'warning',
  [ClarityLevel.Minor]: 'neutral',
  [ClarityLevel.Cleared]: 'success',
}

interface ClarityBadgeProps {
  clarityLevel: string | null | undefined
}

/** Clarity chip on answered questions only — solid bg + white text. */
export function ClarityBadge({ clarityLevel }: ClarityBadgeProps) {
  if (!clarityLevel) return null
  return (
    <Badge
      variant="solid"
      tone={CLARITY_TONE[clarityLevel] ?? 'neutral'}
      size="sm"
    >
      {CLARITY_LABEL[clarityLevel] ?? clarityLevel}
    </Badge>
  )
}
