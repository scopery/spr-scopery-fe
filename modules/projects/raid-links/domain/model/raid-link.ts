import type { RaidLinkTargetType, RaidLinkType } from '../enums/raid-link.enum'

export interface RaidLink {
  id: string
  projectId: string
  raidItemId: string
  targetType: RaidLinkTargetType | string
  targetId: string
  linkType: RaidLinkType | string
  createdAt: string
}

export interface CreateRaidLinkPayload {
  targetType: RaidLinkTargetType | string
  targetId: string
  linkType: RaidLinkType | string
}
