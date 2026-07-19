'use client'

import { HelpCircle } from 'lucide-react'
import { Button } from '@/shared/ui'

interface ExplainFieldButtonProps {
  fieldCode: string
  label?: string
  onExplain: (fieldCode: string, label?: string) => void
  disabled?: boolean
}

/** Field help icon — opens streamed field explanation in guide drawer. */
export function ExplainFieldButton({
  fieldCode,
  label,
  onExplain,
  disabled = false,
}: ExplainFieldButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={disabled}
      aria-label={label ? `Explain ${label}` : `Explain field ${fieldCode}`}
      icon={<HelpCircle size={14} />}
      onClick={() => onExplain(fieldCode, label)}
    />
  )
}
