import type { ReactNode } from 'react'

export const LifecycleStepState = {
  Completed: 'completed',
  Current: 'current',
  Upcoming: 'upcoming',
  Skipped: 'skipped',
} as const

export type LifecycleStepState =
  (typeof LifecycleStepState)[keyof typeof LifecycleStepState]

export interface LifecycleTimelineStep {
  id: string
  label: string
  state: LifecycleStepState
  description?: string
  timestamp?: string
  meta?: ReactNode
}

export interface LifecycleTimelineProps {
  steps: LifecycleTimelineStep[]
  orientation?: 'horizontal' | 'vertical'
  className?: string
  'aria-label'?: string
}
