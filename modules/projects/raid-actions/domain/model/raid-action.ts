import type { RaidActionStatus } from '../enums/raid-action.enum'

export interface RaidAction {
  id: string
  projectId: string
  raidItemId: string
  title: string
  owner: string | null
  dueDate: string | null
  status: RaidActionStatus | string
  completedAt: string | null
  cancelledAt: string | null
}

export interface CreateRaidActionPayload {
  title: string
  owner?: string | null
  dueDate?: string | null
}

export interface UpdateRaidActionPayload {
  title?: string
  owner?: string | null
  dueDate?: string | null
}
