export const ThreadStatus = {
  Open: 'OPEN',
  Resolved: 'RESOLVED',
  Archived: 'ARCHIVED',
} as const
export type ThreadStatus = (typeof ThreadStatus)[keyof typeof ThreadStatus]

export const CommentTargetType = {
  Task: 'TASK',
  Deliverable: 'DELIVERABLE',
  RaidItem: 'RAID_ITEM',
  Decision: 'DECISION',
  Meeting: 'MEETING',
} as const
export type CommentTargetType = (typeof CommentTargetType)[keyof typeof CommentTargetType]
