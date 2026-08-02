'use client'

import { DetailDrawer, Stack, Typography, Button } from '@/shared/ui'
import type { TimelineFlatRow } from '../../domain/model/timeline'

type Props = {
  open: boolean
  onClose: () => void
  items: TimelineFlatRow[]
  onSelect: (rowId: string) => void
  title?: string
  emptyLabel?: string
  hint?: string
}

export function UnscheduledWorkDrawer({
  open,
  onClose,
  items,
  onSelect,
  title = 'Unscheduled work',
  emptyLabel = 'All tasks are scheduled.',
  hint = 'Select a task, then drag across day cells in Planning mode to set dates.',
}: Props) {
  return (
    <DetailDrawer open={open} onClose={onClose} title={title} size="md">
      <Stack direction="vertical" spacing="sm">
        <Typography variant="caption" tone="muted">
          {hint}
        </Typography>
        {items.length === 0 ? (
          <Typography variant="caption" tone="muted">
            {emptyLabel}
          </Typography>
        ) : (
          items.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className="justify-start"
              onClick={() => {
                onSelect(item.id)
                onClose()
              }}
            >
              {item.title}
            </Button>
          ))
        )}
      </Stack>
    </DetailDrawer>
  )
}
