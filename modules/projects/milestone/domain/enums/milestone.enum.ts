export const MilestoneStatus = {
  Pending: 'PENDING',
  Achieved: 'ACHIEVED',
  Missed: 'MISSED',
  Archived: 'ARCHIVED',
} as const
export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus]
