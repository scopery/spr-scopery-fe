import React from 'react'
import { cn } from '@/utils/cn'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Button } from '@/shared/ui/atoms/Button'
import { Copy, ArrowUpRight } from 'lucide-react'
import type { EventCardProps } from './EventCard.types'

/**
 * EventCard component - Event/meeting card with image, title, description, and time
 *
 * @example
 * ```tsx
 * <EventCard
 *   title="Meeting with Gilbert"
 *   description="Design system updates & development"
 *   time="09:00 am - 09:30 am"
 *   image="/meeting-image.jpg"
 *   showCopyLink={true}
 *   onCopyLink={() => console.log('Copy link clicked')}
 * />
 * ```
 */
export const EventCard = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      title = '',
      description,
      time,
      image,
      imageAlt,
      showCopyLink = false,
      copyLinkText = 'Copy the link',
      onCopyLink,
      showShareButton = false,
      onShare,
      onClick: _onClick,
      cardBorderRadius = 'lg',
      cardShadow = 'sm',
      className,
      ...props
    }: EventCardProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component ref={ref} {...props}>
        <Box
          background="white"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('flex w-full flex-col gap-[10px] overflow-hidden p-[10px]', className)}
        >
          {/* Image Section */}
          {image && (
            <Box
              display="block"
              className="relative h-[429px] w-full overflow-hidden rounded-[12px] p-[10px]"
            >
              <Box display="block" className="absolute inset-0 overflow-hidden rounded-[12px]">
                <img src={image} alt={imageAlt || title} className="h-full w-full object-cover" />
              </Box>
              {showShareButton && (
                <Box
                  display="flex"
                  className="relative z-10 h-[43px] w-[43px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.42)]"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={<ArrowUpRight size={24} />}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      onShare?.()
                    }}
                    className="h-full w-full bg-transparent p-0 text-neutral-700 hover:bg-transparent"
                    aria-label="Share event"
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Content Section */}
          <Box display="block" className="p-[10px]">
            <Stack direction="vertical" spacing="xs" className="gap-[5px]">
              {/* Title and Time Row */}
              <Stack
                direction="horizontal"
                spacing="none"
                justify="between"
                align="center"
                className="h-[18px]"
              >
                <Typography variant="h6" weight="semibold" className=" text-[#202020]">
                  {title}
                </Typography>
                {time && (
                  <Typography variant="caption" className="text-[#5a5651]">
                    {time}
                  </Typography>
                )}
              </Stack>

              {/* Description and Copy Link Row */}
              {(description || showCopyLink) && (
                <Stack direction="horizontal" spacing="sm" align="center" className="gap-[10px]">
                  {description && (
                    <Typography variant="small" className="text-[#5a5651]">
                      {description}
                    </Typography>
                  )}
                  {showCopyLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        onCopyLink?.()
                      }}
                      className="h-auto gap-[5px] rounded-[2px] bg-[#d2f8ed] px-[5px] py-[3px] text-[#2a6554] hover:bg-[#c0f0e0]"
                    >
                      <Copy size={11} />
                      {copyLinkText}
                    </Button>
                  )}
                </Stack>
              )}
            </Stack>
          </Box>
        </Box>
      </Component>
    )
  }
)

EventCard.displayName = 'EventCard'
