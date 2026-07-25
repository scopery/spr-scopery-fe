'use client'

import { CheckSquare, Plus } from 'lucide-react'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { actionItemStatusLabel } from '../../domain/rules/meeting.rules'
import type { MeetingActionItem } from '../../domain/model/meeting-action-item'

interface MeetingActionItemListProps {
  actionItems: MeetingActionItem[]
  onAdd: () => void
  onComplete?: (id: string) => void
  onArchive?: (id: string) => void
  onCreateLinkedTask?: (id: string) => void
  hint?: string
}

export function MeetingActionItemList({
  actionItems,
  onAdd,
  onComplete,
  onArchive,
  onCreateLinkedTask,
  hint,
}: MeetingActionItemListProps) {
  return (
    <section className="border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Typography weight="semibold">
          Action items
          {actionItems.length > 0 ? (
            <span className="ml-2 font-normal text-neutral-500">· {actionItems.length}</span>
          ) : null}
        </Typography>
        <Button size="sm" variant="neutral-flat" icon={<Plus size={14} />} onClick={onAdd}>
          Add
        </Button>
      </div>

      {hint ? (
        <Typography variant="small" tone="muted" className="mb-3">
          {hint}
        </Typography>
      ) : null}

      {actionItems.length === 0 ? (
        <div className="border border-dashed border-neutral-200 px-4 py-6 text-center">
          <Typography variant="small" tone="muted" className="mb-3">
            No action items yet. Capture follow-up work during the meeting using{' '}
            <code className="text-neutral-700">/action</code> in live notes, or add one here.
          </Typography>
          <Button size="sm" variant="neutral-flat" icon={<Plus size={14} />} onClick={onAdd}>
            Add action item
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {actionItems.map((a) => {
            const done = a.status === 'COMPLETED'
            return (
              <li
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-3 border border-neutral-100 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Stack direction="horizontal" spacing="sm" className="items-start">
                    <CheckSquare
                      size={16}
                      className={
                        done
                          ? 'mt-0.5 shrink-0 text-secondary'
                          : 'mt-0.5 shrink-0 text-neutral-400'
                      }
                    />
                    <div>
                      <Typography
                        weight="medium"
                        className={done ? 'line-through text-neutral-500' : undefined}
                      >
                        {a.title}
                      </Typography>
                      <Typography variant="small" tone="muted">
                        {a.ownerTargetId ? `Owner · ${a.ownerTargetId.slice(0, 8)}…` : 'No owner'}
                        {a.dueDate ? ` · Due ${a.dueDate}` : ''}
                        {a.linkedTaskId
                          ? ` · Task linked`
                          : ' · Not linked to task'}
                      </Typography>
                    </div>
                  </Stack>
                </div>
                <Stack direction="horizontal" spacing="sm" className="flex-wrap items-center">
                  <Badge tone={done ? 'success' : 'neutral'}>{actionItemStatusLabel(a.status)}</Badge>
                  {!done && onComplete ? (
                    <Button size="sm" variant="neutral-flat" onClick={() => onComplete(a.id)}>
                      Complete
                    </Button>
                  ) : null}
                  {onCreateLinkedTask && !a.linkedTaskId ? (
                    <Button size="sm" variant="neutral-flat" onClick={() => onCreateLinkedTask(a.id)}>
                      Create task
                    </Button>
                  ) : null}
                  {a.status !== 'ARCHIVED' && onArchive ? (
                    <Button
                      size="sm"
                      variant="neutral-flat"
                      tone="error"
                      onClick={() => onArchive(a.id)}
                    >
                      Archive
                    </Button>
                  ) : null}
                </Stack>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
