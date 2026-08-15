'use client'

import { useParams } from 'next/navigation'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useProjectNotifications } from '../hooks/useProjectNotifications'

export function ProjectNotificationSettingsView() {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    subscriptions,
    preferences,
    loading,
    error,
    actionError,
    subscribe,
    mute,
    unmute,
    unsubscribe,
    togglePreference,
  } = useProjectNotifications(projectId)

  if (loading) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="sm">
      <Typography as="h1" size="md" weight="medium">
        Project notifications
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <div className="flex items-center justify-between gap-md">
        <Typography variant="h4">My subscriptions</Typography>
        <Button size="sm" onClick={() => void subscribe('WATCHER')}>
          Watch project
        </Button>
      </div>
      {subscriptions.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No subscriptions yet.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {subscriptions.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-md p-md">
              <Typography variant="small">
                {s.subscriptionType}
                {s.muted ? ' · muted' : ''}
              </Typography>
              <div className="flex gap-xs">
                {s.muted ? (
                  <Button size="sm" variant="ghost" onClick={() => void unmute(s.id)}>
                    Unmute
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => void mute(s.id)}>
                    Mute
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => void unsubscribe(s.id)}>
                  Unsubscribe
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Event preferences</Typography>
      {preferences.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No preferences configured. Toggle to create.
        </Typography>
      ) : null}
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {(preferences.length
          ? preferences
          : [
              { eventCode: 'TASK_STATUS_CHANGED', channel: 'IN_APP', enabled: false, muted: false },
              { eventCode: 'TASK_ASSIGNED', channel: 'EMAIL', enabled: false, muted: false },
            ]
        ).map((p) => (
          <li
            key={`${p.eventCode}-${p.channel}`}
            className="flex items-center justify-between p-md"
          >
            <div>
              <Typography variant="small" weight="medium">
                {p.eventCode}
              </Typography>
              <Typography variant="caption" tone="muted">
                {p.channel}
              </Typography>
            </div>
            <Button
              size="sm"
              variant={p.enabled ? 'primary' : 'outline'}
              onClick={() => void togglePreference(p.eventCode, p.channel)}
            >
              {p.enabled ? 'On' : 'Off'}
            </Button>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
