'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Settings } from 'lucide-react'
import { Badge, Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { useNotifications } from '../hooks/useNotifications'
import { NotificationStatus } from '../../domain/enums/notification.enum'
import type { UserNotification } from '../../domain/model/notification'
import { RemindersTab } from '@/modules/notifications/reminders'
import { AlertsTab } from '@/modules/notifications/alerts'

function formatWhen(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export function NotificationInboxView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'reminders' | 'alerts'>('all')

  const {
    items,
    unreadCount,
    loading,
    error,
    forbidden,
    markRead,
    markAllRead,
    dismiss,
  } = useNotifications()

  const filtered = useMemo(() => {
    if (filter === 'unread') {
      return items.filter((n) => n.status === NotificationStatus.Unread)
    }
    return items
  }, [items, filter])

  const selected: UserNotification | null =
    filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null

  if (loading && items.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to notifications</Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Notifications
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            {unreadCount} unread
          </Typography>
        </div>
        <Stack direction="horizontal" spacing="sm">
          <Button
            size="sm"
            variant="secondary"
            disabled={unreadCount === 0}
            onClick={() => {
              void markAllRead().catch((err) => toast.error(getProblemToastMessage(err)))
            }}
          >
            Mark all read
          </Button>
          <NextLink href={ROUTES.workspace.notificationSettings(workspaceId)}>
            <Button size="sm" variant="ghost" icon={<Settings size={14} />}>
              Settings
            </Button>
          </NextLink>
        </Stack>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="mb-4 inline-flex border border-neutral-200">
        <Button
          size="sm"
          variant={filter === 'all' ? 'secondary' : 'ghost'}
          className="rounded-none"
          onClick={() => setFilter('all')}
        >
          Inbox
        </Button>
        <Button
          size="sm"
          variant={filter === 'unread' ? 'secondary' : 'ghost'}
          className="rounded-none"
          onClick={() => setFilter('unread')}
        >
          Unread
        </Button>
        <Button
          size="sm"
          variant={filter === 'reminders' ? 'secondary' : 'ghost'}
          className="rounded-none"
          onClick={() => setFilter('reminders')}
        >
          Reminders
        </Button>
        <Button
          size="sm"
          variant={filter === 'alerts' ? 'secondary' : 'ghost'}
          className="rounded-none"
          onClick={() => setFilter('alerts')}
        >
          Alerts
        </Button>
      </div>

      {filter === 'reminders' && (
        <div className="border border-neutral-200 bg-white p-5">
          <RemindersTab workspaceId={workspaceId} />
        </div>
      )}

      {filter === 'alerts' && (
        <div className="border border-neutral-200 bg-white p-5">
          <AlertsTab workspaceId={workspaceId} />
        </div>
      )}

      {(filter === 'all' || filter === 'unread') && (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="border border-neutral-200 bg-white">
          {filtered.length === 0 ? (
            <Typography as="div" variant="small" tone="muted" className="p-8 text-center">
              No notifications
            </Typography>
          ) : (
            <ul>
              {filtered.map((n) => (
                <li key={n.id} className="border-b border-neutral-100 last:border-0">
                  <button
                    type="button"
                    className={`w-full px-4 py-3 text-left hover:bg-neutral-50 ${
                      selected?.id === n.id ? 'bg-neutral-50' : ''
                    }`}
                    onClick={() => {
                      setSelectedId(n.id)
                      if (n.status === NotificationStatus.Unread) {
                        void markRead(n.id).catch(() => undefined)
                      }
                    }}
                  >
                    <Stack direction="horizontal" spacing="sm" className="mb-1 items-center">
                      {n.status === NotificationStatus.Unread ? (
                        <Badge variant="solid" tone="info">
                          Unread
                        </Badge>
                      ) : null}
                      <Badge tone="neutral">{n.severity}</Badge>
                    </Stack>
                    <Typography weight="medium" className="line-clamp-1">
                      {n.title}
                    </Typography>
                    <Typography variant="small" tone="muted" className="line-clamp-2">
                      {n.bodyPreview}
                    </Typography>
                    <Typography variant="small" tone="muted" className="mt-1">
                      {formatWhen(n.createdAt)}
                    </Typography>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-neutral-200 bg-white p-5">
          {!selected ? (
            <Typography tone="muted">Select a notification</Typography>
          ) : (
            <div className="space-y-4">
              <Typography as="h2" weight="semibold">
                {selected.title}
              </Typography>
              <Typography>{selected.bodyPreview}</Typography>
              <Typography variant="small" tone="muted">
                {formatWhen(selected.createdAt)} · {selected.sourceSystem ?? '—'}
              </Typography>
              <Stack direction="horizontal" spacing="sm" className="flex-wrap">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void dismiss(selected.id).catch((err) =>
                      toast.error(getProblemToastMessage(err))
                    )
                  }}
                >
                  Dismiss
                </Button>
              </Stack>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
