'use client'

import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  MEETING_WORKSPACE_MODE_LABEL,
  MEETING_WORKSPACE_STEPS,
  meetingWorkspaceStepIndex,
  type MeetingWorkspaceMode,
} from '../../domain/rules/meeting.rules'

interface MeetingLifecycleStepperProps {
  mode: MeetingWorkspaceMode
  autoMode: MeetingWorkspaceMode
  onChange: (mode: MeetingWorkspaceMode) => void
}

/**
 * View-only lifecycle stepper. Changing step does NOT change meeting status.
 * Current progress step: solid secondary bg + white text.
 */
export function MeetingLifecycleStepper({ mode, autoMode, onChange }: MeetingLifecycleStepperProps) {
  const autoIdx = meetingWorkspaceStepIndex(autoMode)

  return (
    <nav
      aria-label="Meeting lifecycle"
      className="flex flex-wrap items-center gap-1 border border-neutral-200 bg-white p-1"
    >
      {MEETING_WORKSPACE_STEPS.map((step, idx) => {
        const viewing = step === mode
        const passed = idx < autoIdx
        const isProgress = step === autoMode

        return (
          <button
            key={step}
            type="button"
            onClick={() => onChange(step)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
              // Progress (lifecycle current): solid blue + white text
              isProgress && 'bg-secondary text-white',
              // Viewing a different step: black fill so selection ≠ progress color
              viewing && !isProgress && 'bg-neutral-900 text-white',
              // Passed (not viewing): black text
              !viewing && !isProgress && passed && 'text-neutral-900 hover:bg-neutral-50',
              // Upcoming
              !viewing && !isProgress && !passed && 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
            )}
            aria-current={viewing ? 'step' : undefined}
          >
            {passed ? (
              <Check
                size={14}
                strokeWidth={2}
                className={isProgress || viewing ? 'text-white' : 'text-neutral-900'}
                aria-hidden
              />
            ) : null}
            {isProgress && !passed ? (
              <span className="h-1.5 w-1.5 shrink-0 bg-white" aria-hidden />
            ) : null}
            {MEETING_WORKSPACE_MODE_LABEL[step]}
            {idx < MEETING_WORKSPACE_STEPS.length - 1 ? (
              <span
                className={cn(
                  'ml-2',
                  isProgress || (viewing && !isProgress) ? 'text-white/45' : 'text-neutral-300'
                )}
                aria-hidden
              >
                —
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
