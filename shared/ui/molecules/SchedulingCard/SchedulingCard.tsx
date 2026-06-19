import React from 'react'
import { cn } from '@/utils/cn'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Button } from '@/shared/ui/atoms/Button'
import { MapPin, Clock } from 'lucide-react'
import type { SchedulingCardProps } from './SchedulingCard.types'

/**
 * SchedulingCard component - Event scheduling card with image, details, and action
 *
 * @example
 * ```tsx
 * <SchedulingCard
 *   description="You have one scheduled event today - don't miss them!"
 *   day="FRIDAY"
 *   date="Mar 28"
 *   event={{
 *     title: "Expo world press photo Montreal",
 *     location: "325 Rue de la Commune E",
 *     time: "10:30am",
 *     image: "/event-image.jpg"
 *   }}
 *   onAction={() => console.log('Marked')}
 * />
 * ```
 */
export const SchedulingCard = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      title = 'Scheduling',
      description,
      day,
      date,
      event = { title: '' },
      actionLabel = 'Mark this event',
      onAction,
      cardBorderRadius = 'lg',
      cardShadow = 'md',
      className,
      ...props
    }: SchedulingCardProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component ref={ref} {...props}>
        <Box
          background="white"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('w-full overflow-hidden', className)}
        >
          {/* Header Section */}
          <Box display="block" className="p-5">
            <Stack direction="horizontal" justify="between" align="end" className="mb-3">
              <Stack direction="vertical" spacing="xs" className="flex-1">
                <Typography variant="h6" weight="semibold" className="text-neutral-900">
                  {title}
                </Typography>
                {description && (
                  <Typography variant="small" className="text-sm text-neutral-600">
                    {description}
                  </Typography>
                )}
              </Stack>
              {(day || date) && (
                <Stack
                  direction="vertical"
                  spacing="none"
                  align="start"
                  justify="end"
                  className="h-full"
                >
                  {day && (
                    <Typography variant="small" className="text-xs uppercase text-neutral-500">
                      {day}
                    </Typography>
                  )}
                  {date && (
                    <Typography variant="h3" weight="bold" className="text-neutral-900">
                      {date}
                    </Typography>
                  )}
                </Stack>
              )}
            </Stack>

            {/* Event Image */}
            {event.image && (
              <Box
                display="block"
                className="mb-4 w-full overflow-hidden rounded-lg"
                style={{ aspectRatio: '16/9' }}
              >
                <img
                  src={event.image}
                  alt={event.imageAlt || event.title}
                  className="h-full w-full object-cover"
                />
              </Box>
            )}

            {/* Event Details */}
            <Stack direction="vertical" spacing="sm" className="mb-4">
              <Typography variant="h6" weight="semibold" className="text-neutral-900">
                {event.title}
              </Typography>

              {(event.location || event.time) && (
                <Stack direction="vertical" spacing="xs" className="gap-2">
                  {event.location && (
                    <Stack direction="horizontal" spacing="sm" align="center">
                      <MapPin size={16} className="flex-shrink-0 text-neutral-600" />
                      <Typography variant="small" className="text-sm text-neutral-700">
                        {event.location}
                      </Typography>
                    </Stack>
                  )}
                  {event.time && (
                    <Stack direction="horizontal" spacing="sm" align="center">
                      <Clock size={16} className="flex-shrink-0 text-neutral-600" />
                      <Typography variant="small" className="text-sm text-neutral-700">
                        {event.time}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>

            {/* Action Button */}
            {onAction && (
              <Box display="block" className="text-center">
                <Button
                  variant="ghost"
                  onClick={onAction}
                  className="font-normal text-[#2d5016] hover:text-[#3a6b1f]"
                >
                  {actionLabel}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Component>
    )
  }
)

SchedulingCard.displayName = 'SchedulingCard'
