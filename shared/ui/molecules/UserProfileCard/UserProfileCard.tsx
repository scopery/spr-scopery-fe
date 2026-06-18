import React from 'react'
import { cn } from '@/utils'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Avatar } from '@/shared/ui/atoms/Avatar'
import { Button } from '@/shared/ui/atoms/Button'
import { Bell } from 'lucide-react'
import type { UserProfileCardProps } from './UserProfileCard.types'

/**
 * UserProfileCard component - User profile card with avatar, name, title, and notification bell
 *
 * @example
 * ```tsx
 * <UserProfileCard
 *   name="Paityn Levin"
 *   title="SR. UI DESIGNER"
 *   avatar="/avatar.jpg"
 *   onNotificationClick={() => console.log('Notifications clicked')}
 * />
 * ```
 */
export const UserProfileCard = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      name = '',
      title = '',
      avatar,
      onNotificationClick,
      cardBorderRadius = 'lg',
      cardShadow = 'sm',
      className,
      ...props
    }: UserProfileCardProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component ref={ref} {...props}>
        <Box
          background="white"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('p-4', className)}
        >
          <Stack direction="horizontal" spacing="md" align="center">
            <Avatar
              size="md"
              src={avatar}
              fallback={name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            />
            <Stack direction="vertical" spacing="none" className="flex-1">
              <Typography variant="small" weight="semibold" className="text-neutral-900">
                {name}
              </Typography>
              <Typography variant="small" className="text-neutral-600 text-xs uppercase">
                {title}
              </Typography>
            </Stack>
            {onNotificationClick && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={<Bell size={18} />}
                onClick={onNotificationClick}
                className="text-neutral-600 hover:text-neutral-900"
                aria-label="Notifications"
              />
            )}
          </Stack>
        </Box>
      </Component>
    )
  }
)

UserProfileCard.displayName = 'UserProfileCard'

