export const PhaseWatchFollowUpKind = {
  All: 'all',
  StartingSoon: 'starting_soon',
  HasBlockers: 'has_blockers',
  NoStartDate: 'no_start_date',
  NoTasks: 'no_tasks',
} as const
export type PhaseWatchFollowUpKind =
  (typeof PhaseWatchFollowUpKind)[keyof typeof PhaseWatchFollowUpKind]

export const PhaseWatchSignal = {
  HasBlockers: 'has_blockers',
  StartingSoon: 'starting_soon',
  NoStartDate: 'no_start_date',
  NoTasks: 'no_tasks',
  UnassignedTasks: 'unassigned_tasks',
  OnTrack: 'on_track',
} as const
export type PhaseWatchSignal = (typeof PhaseWatchSignal)[keyof typeof PhaseWatchSignal]
