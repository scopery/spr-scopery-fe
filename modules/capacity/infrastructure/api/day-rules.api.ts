import { apiClient } from '@/shared/lib/apiClient'
import { CAPACITY_ENDPOINTS } from './endpoints'
import type {
  CalendarDayRule,
  ReplaceDayRulesPayload,
} from '../../domain/model/calendar-day-rule'

export async function listDayRules(calendarId: string): Promise<CalendarDayRule[]> {
  return apiClient.get<CalendarDayRule[]>(CAPACITY_ENDPOINTS.dayRules.list(calendarId))
}

export async function replaceDayRules(
  calendarId: string,
  body: ReplaceDayRulesPayload
): Promise<CalendarDayRule[]> {
  return apiClient.put<CalendarDayRule[]>(CAPACITY_ENDPOINTS.dayRules.replace(calendarId), body)
}
