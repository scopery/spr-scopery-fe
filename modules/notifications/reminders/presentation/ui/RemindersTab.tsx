'use client'

import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useReminders } from '../hooks/useReminders'

interface Props {
  workspaceId: string
}

export function RemindersTab({ workspaceId }: Props) {
  const { reminders, loading, snooze, dismiss } = useReminders(workspaceId)

  const handleSnooze = async (id: string) => {
    const snoozedUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    try {
      await snooze(id, snoozedUntil)
      toast.success('Reminder snoozed for 1 hour')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await dismiss(id)
      toast.success('Reminder dismissed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && reminders.length === 0) {
    return <Typography variant="small" tone="muted">Loading…</Typography>
  }

  if (reminders.length === 0) {
    return <Typography variant="small" tone="muted">No reminders</Typography>
  }

  return (
    <div className="divide-y divide-neutral-100">
      {reminders.map((r) => (
        <div key={r.id} className="flex items-start gap-3 py-3">
          <Bell size={16} className="mt-0.5 shrink-0 text-neutral-400" />
          <div className="flex-1">
            <Typography weight="medium">{r.title}</Typography>
            {r.body ? (
              <Typography variant="small" tone="muted">{r.body}</Typography>
            ) : null}
            <Stack direction="horizontal" spacing="sm" className="mt-1 items-center">
              <Typography variant="small" tone="muted">
                Due {new Date(r.dueAt).toLocaleString()}
              </Typography>
              {r.snoozedUntil ? (
                <Badge tone="warning">Snoozed until {new Date(r.snoozedUntil).toLocaleString()}</Badge>
              ) : null}
              <Badge tone="neutral">{r.source.type}</Badge>
            </Stack>
          </div>
          <Stack direction="horizontal" spacing="sm">
            <Button size="sm" variant="ghost" onClick={() => void handleSnooze(r.id)}>
              Snooze 1h
            </Button>
            <Button
              size="sm"
              variant="ghost"
              tone="error"
              icon={<BellOff size={14} />}
              onClick={() => void handleDismiss(r.id)}
            >
              Dismiss
            </Button>
          </Stack>
        </div>
      ))}
    </div>
  )
}
