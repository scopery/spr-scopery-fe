'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import {
  allowedMeetingLifecycleActions,
  meetingStatusLabel,
  meetingStatusTone,
  type MeetingLifecycleAction,
} from '../../domain/rules/meeting.rules'
import type { Meeting } from '../../domain/model/meeting'

export type AutosaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface MeetingHeaderProps {
  meeting: Meeting
  participantCount: number
  autosaveState: AutosaveState
  /** Seconds remaining before autosave fires (when pending). */
  autosaveSecondsLeft?: number | null
  acting: boolean
  onLifecycle: (action: MeetingLifecycleAction) => void
  onBack: () => void
  onEditDetails?: () => void
}

const PRIMARY_LABEL: Partial<Record<MeetingLifecycleAction, string>> = {
  start: 'Start meeting',
  complete: 'End meeting',
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function autosaveLabel(state: AutosaveState, secondsLeft?: number | null) {
  switch (state) {
    case 'pending':
      return secondsLeft != null && secondsLeft > 0
        ? `Unsaved · saves in ${secondsLeft}s`
        : 'Unsaved · saving soon…'
    case 'saving':
      return 'Saving…'
    case 'saved':
      return 'Saved just now'
    case 'error':
      return 'Couldn’t save · changes pending'
    default:
      return null
  }
}

export function MeetingHeader({
  meeting,
  participantCount,
  autosaveState,
  autosaveSecondsLeft = null,
  acting,
  onLifecycle,
  onBack,
  onEditDetails,
}: MeetingHeaderProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const actions = allowedMeetingLifecycleActions(meeting.status)
  const primary = actions.find((a) => a === 'start' || a === 'complete')
  const danger = actions.filter((a) => a === 'cancel' || a === 'archive')

  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moreOpen])

  const saveLabel = autosaveLabel(autosaveState, autosaveSecondsLeft)

  return (
    <div className="mb-4 border-b border-neutral-200 pb-5">
      <button
        type="button"
        className="mb-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800"
        onClick={onBack}
      >
        <ArrowLeft size={14} aria-hidden />
        Meetings
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Stack direction="horizontal" spacing="sm" className="mb-1 flex-wrap items-center">
            <Typography as="h1" size="lg" weight="semibold" className="truncate">
              {meeting.title}
            </Typography>
            <Badge variant="solid" tone={meetingStatusTone(meeting.status)}>
              {meetingStatusLabel(meeting.status)}
            </Badge>
          </Stack>
          <Typography variant="small" tone="muted">
            {formatDateTime(meeting.startAt)}
            {meeting.location ? ` · ${meeting.location}` : ''}
            {meeting.meetingUrl ? ' · Online' : ''}
            {` · ${participantCount} participant${participantCount === 1 ? '' : 's'}`}
          </Typography>
          {saveLabel ? (
            <Typography
              variant="small"
              className={
                autosaveState === 'error' ? 'mt-1 text-error' : 'mt-1 text-neutral-400'
              }
            >
              {saveLabel}
            </Typography>
          ) : null}
          {meeting.description ? (
            <Typography variant="small" tone="muted" className="mt-2 max-w-2xl">
              {meeting.description}
            </Typography>
          ) : null}
        </div>

        <Stack direction="horizontal" spacing="sm" className="flex-wrap items-center">
          {onEditDetails ? (
            <Button size="sm" variant="neutral-flat" onClick={onEditDetails}>
              Edit details
            </Button>
          ) : null}
          {primary ? (
            <Button
              size="sm"
              variant="neutral-flat"
              className="bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white"
              disabled={acting}
              onClick={() => onLifecycle(primary)}
            >
              {PRIMARY_LABEL[primary] ?? primary}
            </Button>
          ) : null}
          {danger.length > 0 ? (
            <div className="relative" ref={moreRef}>
              <Button
                size="sm"
                variant="neutral-flat"
                icon={<MoreHorizontal size={16} />}
                aria-label="More actions"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((v) => !v)}
              >
                More
              </Button>
              {moreOpen ? (
                <div className="absolute right-0 z-20 mt-1 min-w-[180px] border border-neutral-200 bg-white py-1 shadow-md">
                  {danger.map((action) => (
                    <button
                      key={action}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-error hover:bg-neutral-50"
                      disabled={acting}
                      onClick={() => {
                        setMoreOpen(false)
                        onLifecycle(action)
                      }}
                    >
                      {action === 'cancel' ? 'Cancel meeting' : 'Archive meeting'}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </Stack>
      </div>
    </div>
  )
}
