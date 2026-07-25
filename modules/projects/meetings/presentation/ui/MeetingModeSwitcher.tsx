'use client'

import { cn } from '@/utils/cn'
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

/**
 * @deprecated Prefer MeetingLifecycleStepper — kept for backward-compatible imports.
 */
export function MeetingModeSwitcher({ mode, autoMode, onChange }: MeetingModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Meeting workspace mode"
      className="inline-flex border border-neutral-200 bg-white p-1"
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
                ? 'bg-secondary text-white'
                : 'text-neutral-500 hover:text-neutral-800'
            )}
          >
            {MEETING_WORKSPACE_MODE_LABEL[m]}
            {m === autoMode ? (
              <span className={cn('ml-1 text-xs', active ? 'text-white/70' : 'text-neutral-400')}>
                (auto)
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
