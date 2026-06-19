import React from 'react'
import { cn } from '@/utils/cn'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Sparkles } from 'lucide-react'
import type { AISuggestionProps } from './AISuggestion.types'

/**
 * AISuggestion component - AI-powered suggestion popup with Yes/No options
 *
 * @example
 * ```tsx
 * <AISuggestion
 *   question="Would you like to set this task to High Priority and add a due date for this week?"
 *   onYes={() => console.log('Yes clicked')}
 *   onNo={() => console.log('No clicked')}
 * />
 * ```
 */
export const AISuggestion = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      title = 'AI suggestions',
      question = '',
      yesLabel = 'Yes',
      noLabel = 'No',
      onYes,
      onNo,
      showIcon = true,
      cardBorderRadius = 'lg',
      cardShadow = 'lg',
      className,
      ...props
    }: AISuggestionProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component ref={ref} {...props}>
        <Box
          background="transparent"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('flex flex-col gap-3 bg-[#312C22] p-4', className)}
        >
          {/* Header */}
          <Stack direction="horizontal" spacing="sm" align="center">
            {showIcon && <Sparkles size={16} className="text-[#d4f5a0]" />}
            <Typography variant="h6" weight="normal" className="text-sm text-[#d4f5a0]">
              {title}
            </Typography>
          </Stack>

          {/* Question */}
          <Typography variant="body" className="text-sm leading-relaxed text-[#C7C3BB]">
            {question}
          </Typography>

          {/* Options */}
          <Stack direction="horizontal" spacing="sm" align="center" className="flex-wrap">
            {onYes && (
              <button
                onClick={onYes}
                className="cursor-pointer text-sm font-normal text-[#f5a623] transition-colors hover:text-[#ffb84d]"
                aria-label={yesLabel}
              >
                {yesLabel}
              </button>
            )}
            {onYes && onNo && <span className="text-sm text-white">/</span>}
            {onNo && (
              <button
                onClick={onNo}
                className="cursor-pointer text-sm font-normal text-white transition-colors hover:text-neutral-200"
                aria-label={noLabel}
              >
                {noLabel}
              </button>
            )}
          </Stack>
        </Box>
      </Component>
    )
  }
)

AISuggestion.displayName = 'AISuggestion'
