import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CalendarException,
  CalendarExceptionSearchParams,
  CreateCalendarExceptionPayload,
  UpdateCalendarExceptionPayload,
} from '../../domain/model/calendar-exception'

export async function listExceptions(
  calendarId: string,
  params?: CalendarExceptionSearchParams
): Promise<PageResponse<CalendarException>> {
  return apiClient.get<PageResponse<CalendarException>>(
    CAPACITY_ENDPOINTS.exceptions.list(calendarId, params)
  )
}

export async function createException(
  calendarId: string,
  body: CreateCalendarExceptionPayload
): Promise<CalendarException> {
  return apiClient.post<CalendarException>(
    CAPACITY_ENDPOINTS.exceptions.create(calendarId),
    body
  )
}

export async function updateException(
  calendarId: string,
  exceptionId: string,
  body: UpdateCalendarExceptionPayload
): Promise<CalendarException> {
  return apiClient.put<CalendarException>(
    CAPACITY_ENDPOINTS.exceptions.update(calendarId, exceptionId),
    body
  )
}

export async function deleteException(
  calendarId: string,
  exceptionId: string
): Promise<void> {
  await apiClient.delete<void>(CAPACITY_ENDPOINTS.exceptions.delete(calendarId, exceptionId), {
    parseJson: false,
  })
}
