'use client'

import { cn } from '@/utils/cn'
import { Typography } from '@/shared/ui'
import {
  MEETING_WORKSPACE_MODE_LABEL,
  type MeetingWorkspaceMode,
} from '../../domain/rules/meeting.rules'

interface MeetingModeSwitcherProps {
  mode: MeetingWorkspaceMode
  autoMode: MeetingWorkspaceMode
  onChange: (mode: MeetingWorkspaceMode) => void
}

const MODES: MeetingWorkspaceMode[] = ['pre', 'during', 'post']

/** Lets the user manually override the auto-selected (status-based) workspace mode. */
export function MeetingModeSwitcher({ mode, autoMode, onChange }: MeetingModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Meeting workspace mode"
      className="inline-flex border border-neutral-200 bg-neutral-50 p-1"
    >
      {MODES.map((m) => {
        const active = m === mode
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-white text-primary shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            )}
          >
            {MEETING_WORKSPACE_MODE_LABEL[m]}
            {m === autoMode && (
              <Typography
                as="span"
                size="xs"
                className={cn('ml-1', active ? 'text-primary/60' : 'text-neutral-400')}
              >
                (auto)
              </Typography>
            )}
          </button>
        )
      })}
    </div>
  )
}
