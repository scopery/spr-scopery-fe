import React from 'react'
import { cn } from '@/utils/cn'
import { Box } from '@/shared/ui/atoms/Box'
import { Stack } from '@/shared/ui/atoms/Stack'
import { Typography } from '@/shared/ui/atoms/Typography'
import { Avatar } from '@/shared/ui/atoms/Avatar'
import { Button } from '@/shared/ui/atoms/Button'
import { Badge } from '@/shared/ui/atoms/Badge'
import { Plus } from 'lucide-react'
import type { TodoListProps, TodoStatus } from './TodoList.types'

const statusConfig: Record<TodoStatus, { bgColor: string; textColor: string }> = {
  blocking: { bgColor: 'bg-[#e8ffd9]', textColor: 'text-[#7fa720]' },
  essential: { bgColor: 'bg-[#eef8ff]', textColor: 'text-[#0a72cc]' },
  urgent: { bgColor: 'bg-[#fff0e8]', textColor: 'text-[#c98f28]' },
  normal: { bgColor: 'bg-neutral-100', textColor: 'text-neutral-900' },
}

/**
 * TodoList component - Task management list
 *
 * @example
 * ```tsx
 * <TodoList
 *   items={[
 *     { id: '1', title: 'Task 1', date: 'Mar 24th', status: 'blocking' },
 *     { id: '2', title: 'Task 2', date: 'Mar 23rd', status: 'urgent', expanded: true, description: 'Description', assignee: { name: 'John Doe' } }
 *   ]}
 *   onAdd={() => console.log('Add clicked')}
 *   onToggle={(id, completed) => console.log(id, completed)}
 * />
 * ```
 */
export const TodoList = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      as,
      title = 'To do list',
      items = [],
      onAdd,
      onToggle: _onToggle,
      onExpand,
      cardBorderRadius = 'lg',
      cardShadow = 'sm',
      className,
      ...props
    }: TodoListProps<C>,
    ref?: React.Ref<HTMLDivElement>
  ) => {
    const Component = as || 'div'

    // Internal state to manage expanded items
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
      new Set(items.filter((item) => item.expanded).map((item) => item.id))
    )

    // Update internal state when items change
    React.useEffect(() => {
      setExpandedItems(new Set(items.filter((item) => item.expanded).map((item) => item.id)))
    }, [items])

    const handleExpand = (id: string) => {
      const isCurrentlyExpanded = expandedItems.has(id)
      const newExpanded = !isCurrentlyExpanded

      // Update internal state
      setExpandedItems((prev) => {
        const next = new Set(prev)
        if (newExpanded) {
          next.add(id)
        } else {
          next.delete(id)
        }
        return next
      })

      // Call parent callback
      onExpand?.(id, newExpanded)
    }

    return (
      <Component ref={ref} {...props}>
        <Box
          background="white"
          padding="md"
          radius={cardBorderRadius}
          shadow={cardShadow}
          className={cn('w-full', className)}
        >
          {/* Header */}
          <Stack
            direction="horizontal"
            spacing="none"
            justify="between"
            align="center"
            className="pb-sm"
          >
            <Typography variant="h6" weight="semibold" className="text-black">
              {title}
            </Typography>
            {onAdd && (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={<Plus size={16} />}
                onClick={onAdd}
                className="text-black"
                aria-label="Add new task"
              />
            )}
          </Stack>

          {/* Task List */}
          <Stack direction="vertical" spacing="sm">
            {items.map((item, _index) => {
              const isExpanded = expandedItems.has(item.id)
              const status = item.status || 'normal'
              const statusStyle = statusConfig[status]

              return (
                <React.Fragment key={item.id}>
                  {/* Task Item */}
                  <Stack direction="vertical" spacing="sm">
                    {/* Main Task Row */}
                    <Stack direction="horizontal" spacing="xs" align="start">
                      {/* Expand/Collapse Icon */}
                      <Box display="flex" className="flex-shrink-0 pt-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          iconOnly
                          icon={
                            <Plus
                              size={16}
                              className={cn(
                                'text-neutral-400 transition-transform duration-200',
                                isExpanded && 'rotate-45'
                              )}
                            />
                          }
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            handleExpand(item.id)
                          }}
                          className="h-4 w-4 border-0 bg-transparent p-0 hover:opacity-70"
                          aria-label={
                            isExpanded ? `Collapse ${item.title}` : `Expand ${item.title}`
                          }
                        />
                      </Box>

                      {/* Task Content */}
                      <Stack direction="vertical" spacing="sm" className="min-w-0 flex-1">
                        <Typography
                          variant="small"
                          size="sm"
                          weight={isExpanded ? 'medium' : 'normal'}
                          className={cn(
                            'text-[#595552]',
                            item.completed && 'text-neutral-500 line-through'
                          )}
                        >
                          {item.title}
                        </Typography>

                        {/* Date and Status */}
                        {(item.date || item.status) && (
                          <Stack direction="horizontal" spacing="sm" align="center">
                            {item.date && (
                              <Typography variant="caption" size="xs" className="text-[#5a5651]">
                                {item.date}
                              </Typography>
                            )}
                            {item.status && (
                              <Badge
                                variant="soft"
                                size="sm"
                                className={cn(
                                  statusStyle.bgColor,
                                  statusStyle.textColor,
                                  'text-xs',
                                  status === 'essential' && 'font-semibold'
                                )}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </Stack>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <Stack direction="horizontal" spacing="sm" align="start" className="pl-5">
                        {/* Connector Line */}
                        <Box
                          display="flex"
                          className="w-3.5 flex-shrink-0 items-start justify-center pt-1"
                        >
                          <Box
                            display="block"
                            className="min-h-[60px] w-px border-l-[1.5px] border-dashed border-neutral-300"
                          />
                        </Box>

                        {/* Expanded Details */}
                        <Stack direction="vertical" spacing="sm" className="flex-1">
                          {/* Description */}
                          {item.description && (
                            <Typography variant="small" size="xs" className="text-[#5a5651]">
                              {item.description}
                            </Typography>
                          )}

                          {/* Assignee */}
                          {item.assignee && (
                            <Stack direction="horizontal" spacing="sm" align="center">
                              <Avatar
                                size="sm"
                                src={item.assignee.avatar}
                                fallback={item.assignee.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()}
                              />
                              <Typography
                                variant="small"
                                size="xs"
                                className="text-[#5a5651]"
                                weight="medium"
                              >
                                {item.assignee.name}
                              </Typography>
                              <Typography
                                variant="small"
                                size="xs"
                                className="text-[#256650]"
                                weight="medium"
                              >
                                (Assignee)
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </React.Fragment>
              )
            })}
          </Stack>
        </Box>
      </Component>
    )
  }
)

TodoList.displayName = 'TodoList'
