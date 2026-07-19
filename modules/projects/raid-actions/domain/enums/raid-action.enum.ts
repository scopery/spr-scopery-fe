export const RaidActionStatus = {
  Open: 'OPEN',
  InProgress: 'IN_PROGRESS',
  Complete: 'COMPLETE',
  Cancelled: 'CANCELLED',
} as const
export type RaidActionStatus = (typeof RaidActionStatus)[keyof typeof RaidActionStatus]
