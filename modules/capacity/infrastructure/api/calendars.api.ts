import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../domain/model/common'
import type {
  CreateWorkingCalendarPayload,
  UpdateWorkingCalendarPayload,
  WorkingCalendar,
  WorkingCalendarSearchParams,
} from '../../domain/model/working-calendar'

export async function listWorkingCalendars(
  params: WorkingCalendarSearchParams
): Promise<PageResponse<WorkingCalendar>> {
  return apiClient.get<PageResponse<WorkingCalendar>>(CAPACITY_ENDPOINTS.calendars.list(params))
}

export async function getWorkingCalendar(calendarId: string): Promise<WorkingCalendar> {
  return apiClient.get<WorkingCalendar>(CAPACITY_ENDPOINTS.calendars.get(calendarId))
}

export async function createWorkingCalendar(
  workspaceId: string,
  body: CreateWorkingCalendarPayload
): Promise<WorkingCalendar> {
  return apiClient.post<WorkingCalendar>(CAPACITY_ENDPOINTS.calendars.create(workspaceId), body)
}

export async function updateWorkingCalendar(
  calendarId: string,
  body: UpdateWorkingCalendarPayload
): Promise<WorkingCalendar> {
  return apiClient.put<WorkingCalendar>(CAPACITY_ENDPOINTS.calendars.update(calendarId), body)
}

export async function activateWorkingCalendar(calendarId: string): Promise<WorkingCalendar> {
  return apiClient.patch<WorkingCalendar>(CAPACITY_ENDPOINTS.calendars.activate(calendarId))
}

export async function deactivateWorkingCalendar(calendarId: string): Promise<WorkingCalendar> {
  return apiClient.patch<WorkingCalendar>(CAPACITY_ENDPOINTS.calendars.deactivate(calendarId))
}

export async function archiveWorkingCalendar(calendarId: string): Promise<WorkingCalendar> {
  return apiClient.patch<WorkingCalendar>(CAPACITY_ENDPOINTS.calendars.archive(calendarId))
}

export async function setDefaultWorkingCalendar(calendarId: string): Promise<WorkingCalendar> {
  return apiClient.patch<WorkingCalendar>(CAPACITY_ENDPOINTS.calendars.setDefault(calendarId))
}
