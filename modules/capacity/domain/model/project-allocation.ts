import type { AllocationType, CapacityEntityStatus } from '../enums/capacity.enum'
import type { PageParams } from './common'

export interface ProjectResourceAllocation {
  id: string
  workspaceId: string
  projectId: string
  workspaceMemberId: string
  userId: string | null
  allocationPercent: number
  allocationType: AllocationType
  status: CapacityEntityStatus
  startDate: string
  endDate: string
  notes: string | null
  archivedAt: string | null
  archivedBy: string | null
  version: number
}

export interface CreateProjectAllocationPayload {
  projectId: string
  workspaceMemberId: string
  allocationPercent: number
  allocationType: AllocationType
  startDate: string
  endDate: string
  notes?: string | null
}

export interface UpdateProjectAllocationPayload {
  projectId?: string
  workspaceMemberId?: string
  allocationPercent?: number
  allocationType?: AllocationType
  startDate?: string
  endDate?: string
  notes?: string | null
}

export interface ProjectAllocationSearchParams extends PageParams {
  workspaceId: string
  projectId?: string
  workspaceMemberId?: string
  userId?: string
  status?: CapacityEntityStatus
}
