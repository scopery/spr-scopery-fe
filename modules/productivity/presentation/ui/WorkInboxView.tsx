'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useWorkInbox } from '../hooks/useWorkInbox'
import { InboxItemStatus } from '../../domain/enums/productivity.enum'

export function WorkInboxView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, loading, error, markRead } = useWorkInbox(workspaceId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Work Inbox</Typography>
      {!(items ?? []).length ? (
        <Typography tone="muted">You are all caught up.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {(items ?? []).map((item) => {
            const unread = item.status === InboxItemStatus.Unread || item.status === 'UNREAD'
            return (
              <li key={item.id} className="flex items-start justify-between gap-md p-md">
                <div>
                  <Typography variant="small" weight={unread ? 'semibold' : 'medium'}>
                    {item.href ? (
                      <Link href={item.href} className="hover:underline">
                        {item.title}
                      </Link>
                    ) : (
                      item.title
                    )}
                  </Typography>
                  {item.body ? (
                    <Typography variant="caption" tone="muted">
                      {item.body}
                    </Typography>
                  ) : null}
                </div>
                {unread ? (
                  <Button size="sm" variant="ghost" onClick={() => void markRead(item.id)}>
                    Mark read
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Stack>
  )
}
