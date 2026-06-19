import React from 'react'
import { cn } from '@/utils/cn'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Avatar } from '@/shared/ui/atoms/Avatar'
import { Button } from '@/shared/ui/atoms/Button'
import { Send, Check } from 'lucide-react'
import type { NotificationCardProps } from './NotificationCard.types'

/**
 * NotificationCard component - Notification item with sender, message, and metadata
 *
 * @example
 * ```tsx
 * <NotificationCard
 *   sender={{
 *     name: 'Charlie Herwitz',
 *     role: 'PRODUCT DIRECTOR',
 *     avatar: '/avatar.jpg'
 *   }}
 *   message="Would you like them formatted for a specific use case?"
 *   timeAgo="5 mins"
 *   read={true}
 *   onSend={() => console.log('Send clicked')}
 * />
 * ```
 */
export const NotificationCard = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      title = 'Notifications',
      sender = { name: '' },
      message = '',
      timeAgo,
      read = false,
      onSend,
      onClick: _onClick,
      cardBorderRadius = 'lg',
      cardShadow = 'sm',
      className,
      ...props
    }: NotificationCardProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    return (
      <Component ref={ref} {...props}>
        <Box
          background="white"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('w-full px-5 py-[25px]', className)}
        >
          {/* Header */}
          {title && (
            <Box display="flex" className="mb-[10px]">
              <Typography variant="h6" weight="semibold" className="text-black">
                {title}
              </Typography>
            </Box>
          )}

          {/* Sender Info */}
          <Stack
            direction="horizontal"
            spacing="none"
            justify="between"
            align="center"
            className="mb-[10px]"
          >
            <Stack direction="horizontal" spacing="sm" align="center">
              <Avatar
                size="sm"
                src={sender.avatar}
                fallback={sender.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              />
              <Stack direction="vertical" spacing="none">
                <Typography variant="small" className=" text-[#373737]" weight="medium">
                  {sender.name}
                </Typography>
                {sender.role && (
                  <Typography className="text-xs uppercase text-[#ac6021]">
                    {sender.role}
                  </Typography>
                )}
              </Stack>
            </Stack>
            {onSend && (
              <Button
                variant="ghost"
                size="md"
                iconOnly
                icon={<Send size={16} />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  onSend()
                }}
                className="rounded-full bg-[#f3f3f3] p-1 hover:bg-[#e5e5e5]"
                aria-label="Send message"
              />
            )}
          </Stack>

          {/* Message Bubble */}
          <Box display="block" className="mb-[10px] rounded-[10px] bg-[#f6f6f6] p-[10px]">
            <Typography variant="small" className="text-[#55544e]">
              {message}
            </Typography>
          </Box>

          {/* Footer - Time and Read Status */}
          {(timeAgo || read) && (
            <Stack direction="horizontal" spacing="sm" align="center" justify="left">
              {timeAgo && (
                <Typography variant="caption" className="text-[#5a5651]">
                  {timeAgo}
                </Typography>
              )}
              {timeAgo && read && (
                <Box display="block" className="h-0.5 w-0.5 rounded-full bg-[#5a5651]" />
              )}
              {read && (
                <Stack direction="horizontal" spacing="xs" align="center">
                  <Typography variant="caption" className="text-[#5a5651]">
                    Read
                  </Typography>
                  <Check size={10} className="text-[#5a5651]" />
                </Stack>
              )}
            </Stack>
          )}
        </Box>
      </Component>
    )
  }
)

NotificationCard.displayName = 'NotificationCard'
