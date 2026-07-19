import type { MilestoneStatus } from '../enums/milestone.enum'

export interface Milestone {
  id: string
  projectId: string
  name: string
  code: string
  targetDate: string | null
  status: MilestoneStatus | string
  phaseId: string | null
  notes: string | null
  createdAt: string
}

export interface CreateMilestonePayload {
  name: string
  code: string
  targetDate?: string | null
  phaseId?: string | null
  notes?: string | null
}

export interface UpdateMilestonePayload {
  name?: string
  targetDate?: string | null
  phaseId?: string | null
  notes?: string | null
}
