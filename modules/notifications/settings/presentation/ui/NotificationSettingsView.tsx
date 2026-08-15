'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Input, PageSkeleton, Stack, Typography, Card } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useNotificationSettings } from '../hooks/useNotificationSettings'
import { ProjectSearchSelect } from '@/modules/projects'

export function NotificationSettingsView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const {
    preferences,
    subscriptions,
    channelPreferences,
    suppressions,
    loading,
    error,
    forbidden,
    savePreferences,
    addSubscription,
    removeSubscription,
    saveChannelPreferences,
  } = useNotificationSettings(workspaceId)

  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh')
  const [digestEnabled, setDigestEnabled] = useState(false)
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00')
  const [targetId, setTargetId] = useState('')
  const [saving, setSaving] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [inAppEnabled, setInAppEnabled] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [savingChannel, setSavingChannel] = useState(false)

  useEffect(() => {
    if (!preferences) return
    setTimezone(preferences.timezone ?? 'Asia/Ho_Chi_Minh')
    setDigestEnabled(!!preferences.digestEnabled)
    setQuietHoursEnabled(!!preferences.quietHoursEnabled)
    setQuietHoursStart(preferences.quietHoursStart ?? '22:00')
    setQuietHoursEnd(preferences.quietHoursEnd ?? '08:00')
  }, [preferences])

  useEffect(() => {
    if (!channelPreferences) return
    setEmailEnabled(channelPreferences.emailEnabled)
    setInAppEnabled(channelPreferences.inAppEnabled)
    setPushEnabled(channelPreferences.pushEnabled)
  }, [channelPreferences])

  if (loading && !preferences) return <PageSkeleton variant="detail" />
  if (forbidden) {
    return (
      <Card className="p-8 text-center">
        <Typography weight="medium">You don’t have access to notification settings</Typography>
      </Card>
    )
  }

  return (
    <div>
      <Typography as="h1" size="md" weight="medium" className="mb-2">
        Notification settings
      </Typography>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <Card as="section" className="mb-8 max-w-lg space-y-4 p-5">
        <Typography as="h2" weight="semibold">
          Delivery preferences
        </Typography>
        <Input
          label="Timezone"
          fullWidth
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={digestEnabled}
            onChange={(e) => setDigestEnabled(e.target.checked)}
          />
          Enable digest
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={quietHoursEnabled}
            onChange={(e) => setQuietHoursEnabled(e.target.checked)}
          />
          Quiet hours
        </label>
        {quietHoursEnabled ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type="time"
              fullWidth
              value={quietHoursStart}
              onChange={(e) => setQuietHoursStart(e.target.value)}
            />
            <Input
              label="End"
              type="time"
              fullWidth
              value={quietHoursEnd}
              onChange={(e) => setQuietHoursEnd(e.target.value)}
            />
          </div>
        ) : null}
        <Button
          variant="primary"
          loading={saving}
          onClick={() => {
            setSaving(true)
            void savePreferences({
              timezone,
              digestEnabled,
              quietHoursEnabled,
              quietHoursStart: quietHoursEnabled ? quietHoursStart : null,
              quietHoursEnd: quietHoursEnabled ? quietHoursEnd : null,
              defaultMode: preferences?.defaultMode ?? 'IMMEDIATE',
            })
              .then(() => toast.success('Preferences saved'))
              .catch((err) => toast.error(getProblemToastMessage(err)))
              .finally(() => setSaving(false))
          }}
        >
          Save preferences
        </Button>
      </Card>

      <Card as="section" className="mb-8 max-w-lg space-y-4 p-5">
        <Typography as="h2" weight="semibold">
          Channel preferences
        </Typography>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
          />
          Email notifications
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inAppEnabled}
            onChange={(e) => setInAppEnabled(e.target.checked)}
          />
          In-app notifications
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pushEnabled}
            onChange={(e) => setPushEnabled(e.target.checked)}
          />
          Push notifications
        </label>
        <Button
          variant="primary"
          loading={savingChannel}
          onClick={() => {
            setSavingChannel(true)
            void saveChannelPreferences({
              emailEnabled,
              inAppEnabled,
              pushEnabled,
              smsEnabled: false,
            })
              .then(() => toast.success('Channel preferences saved'))
              .catch((err) => toast.error(getProblemToastMessage(err)))
              .finally(() => setSavingChannel(false))
          }}
        >
          Save channel preferences
        </Button>
      </Card>

      {suppressions.length > 0 && (
        <Card as="section" className="mb-8 max-w-lg space-y-3 p-5">
          <Typography as="h2" weight="semibold">
            Active suppressions
          </Typography>
          <Typography variant="small" tone="muted">
            These channels/categories are currently suppressed. Suppressions are managed by your
            administrator.
          </Typography>
          <ul className="divide-y divide-neutral-100 border border-neutral-100">
            {suppressions.map((s) => (
              <li key={s.id} className="px-3 py-2 text-sm">
                <span className="font-medium">{s.channel}</span>
                {s.category ? <span className="text-neutral-500"> · {s.category}</span> : null}
                {s.reason ? <span className="ml-2 italic text-neutral-400">{s.reason}</span> : null}
                {s.expiresAt ? (
                  <span className="ml-2 text-neutral-400">
                    Expires {new Date(s.expiresAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="ml-2 text-neutral-400">Permanent</span>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card as="section" className="max-w-lg space-y-4 p-5">
        <Typography as="h2" weight="semibold">
          Project subscriptions
        </Typography>
        <Stack direction="horizontal" spacing="sm" className="items-end">
          <div className="flex-1">
            <ProjectSearchSelect
              workspaceId={workspaceId}
              value={targetId}
              onChange={setTargetId}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              if (!targetId.trim()) return
              void addSubscription({
                targetType: 'PROJECT',
                targetId: targetId.trim(),
                subscriptionLevel: 'ALL',
              })
                .then(() => {
                  setTargetId('')
                  toast.success('Subscribed')
                })
                .catch((err) => toast.error(getProblemToastMessage(err)))
            }}
          >
            Subscribe
          </Button>
        </Stack>
        <ul className="divide-y divide-neutral-100 border border-neutral-100">
          {subscriptions.length === 0 ? (
            <li className="px-3 py-4">
              <Typography variant="small" tone="muted">
                No subscriptions
              </Typography>
            </li>
          ) : (
            subscriptions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <Typography as="span" variant="small">
                  {s.targetType === 'PROJECT' ? 'Project subscription' : s.targetType} ·{' '}
                  {s.subscriptionLevel}
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    void removeSubscription(s.id)
                      .then(() => toast.success('Unsubscribed'))
                      .catch((err) => toast.error(getProblemToastMessage(err)))
                  }}
                >
                  Remove
                </Button>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}
