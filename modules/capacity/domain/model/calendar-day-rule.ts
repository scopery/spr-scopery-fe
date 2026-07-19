import type { DayOfWeek } from '../enums/capacity.enum'

export interface CalendarDayRule {
  id: string
  workingCalendarId: string
  dayOfWeek: DayOfWeek
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  workingHours: number
}

export interface DayRuleInput {
  dayOfWeek: DayOfWeek
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  workingHours: number
}

export interface ReplaceDayRulesPayload {
  dayRules: DayRuleInput[]
}
