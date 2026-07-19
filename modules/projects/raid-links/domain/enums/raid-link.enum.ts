export const RaidLinkTargetType = {
  RaidItem: 'RAID_ITEM',
  Decision: 'DECISION',
  Task: 'TASK',
  Deliverable: 'DELIVERABLE',
} as const
export type RaidLinkTargetType = (typeof RaidLinkTargetType)[keyof typeof RaidLinkTargetType]

export const RaidLinkType = {
  RelatedTo: 'RELATED_TO',
  BlockedBy: 'BLOCKED_BY',
  Blocks: 'BLOCKS',
  DuplicateOf: 'DUPLICATE_OF',
} as const
export type RaidLinkType = (typeof RaidLinkType)[keyof typeof RaidLinkType]
