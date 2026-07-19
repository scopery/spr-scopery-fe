import type { CalendarExceptionType } from '../enums/capacity.enum'
import type { PageParams } from './common'

export interface CalendarException {
  id: string
  workingCalendarId: string
  exceptionDate: string
  exceptionType: CalendarExceptionType
  name: string
  description: string | null
  isWorkingDay: boolean
  workingHours: number
  createdAt: string
  updatedAt: string
}

export interface CreateCalendarExceptionPayload {
  exceptionDate: string
  exceptionType: CalendarExceptionType
  name: string
  description?: string | null
  isWorkingDay: boolean
  workingHours: number
}

export type UpdateCalendarExceptionPayload = CreateCalendarExceptionPayload

export interface CalendarExceptionSearchParams extends PageParams {
  from?: string
  to?: string
}
