import type { CapacityEntityStatus } from '../enums/capacity.enum'
import type { PageParams } from './common'

export interface UserCapacityProfile {
  id: string
  workspaceId: string
  workspaceMemberId: string
  userId: string
  workingCalendarId: string
  defaultDailyHours: number
  focusFactor: number
  effectiveFrom: string
  effectiveTo: string | null
  status: CapacityEntityStatus
  createdAt: string
  updatedAt: string
}

export interface CreateUserCapacityProfilePayload {
  workspaceMemberId: string
  workingCalendarId: string
  defaultDailyHours: number
  focusFactor: number
  effectiveFrom: string
  effectiveTo?: string | null
}

export interface UpdateUserCapacityProfilePayload {
  workingCalendarId?: string
  defaultDailyHours?: number
  focusFactor?: number
  effectiveFrom?: string
  effectiveTo?: string | null
}

export interface UserCapacityProfileSearchParams extends PageParams {
  workspaceId: string
  workspaceMemberId?: string
  userId?: string
  status?: CapacityEntityStatus
}
