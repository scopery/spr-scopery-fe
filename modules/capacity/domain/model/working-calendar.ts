import type { CapacityEntityStatus } from '../enums/capacity.enum'
import type { PageParams } from './common'

export interface WorkingCalendar {
  id: string
  workspaceId: string
  code: string
  name: string
  description: string | null
  timezone: string
  isDefault: boolean
  status: CapacityEntityStatus
  archivedAt: string | null
  archivedBy: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateWorkingCalendarPayload {
  code: string
  name: string
  description?: string
  timezone: string
  isDefault?: boolean
}

export interface UpdateWorkingCalendarPayload {
  code?: string
  name?: string
  description?: string | null
  timezone?: string
}

export interface WorkingCalendarSearchParams extends PageParams {
  workspaceId: string
  status?: CapacityEntityStatus
  isDefault?: boolean
  code?: string
}
