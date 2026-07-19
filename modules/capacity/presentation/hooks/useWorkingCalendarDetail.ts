'use client'

import { useCallback, useEffect, useState } from 'react'
import * as calendarsApi from '../../infrastructure/api/calendars.api'
import * as dayRulesApi from '../../infrastructure/api/day-rules.api'
import * as exceptionsApi from '../../infrastructure/api/exceptions.api'
import { areDayRulesValid } from '../../domain/rules/capacity.rules'
import { DAY_OF_WEEK_ORDER, type DayOfWeek } from '../../domain/enums/capacity.enum'
import type { DayRuleInput } from '../../domain/model/calendar-day-rule'
import type {
  CalendarException,
  CreateCalendarExceptionPayload,
} from '../../domain/model/calendar-exception'
import type { WorkingCalendar } from '../../domain/model/working-calendar'

function padDayRules(rules: DayRuleInput[]): DayRuleInput[] {
  return DAY_OF_WEEK_ORDER.map((day) => {
    const found = rules.find((r) => r.dayOfWeek === day)
    return (
      found ?? {
        dayOfWeek: day,
        isWorkingDay: false,
        startTime: null,
        endTime: null,
        workingHours: 0,
      }
    )
  })
}

export function useWorkingCalendarDetail(calendarId: string | null) {
  const [calendar, setCalendar] = useState<WorkingCalendar | null>(null)
  const [dayRules, setDayRules] = useState<DayRuleInput[]>([])
  const [exceptions, setExceptions] = useState<CalendarException[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingRules, setSavingRules] = useState(false)
  const [dirtyRules, setDirtyRules] = useState(false)

  const load = useCallback(async () => {
    if (!calendarId) return
    setLoading(true)
    setError(null)
    try {
      const [cal, rules, exRes] = await Promise.all([
        calendarsApi.getWorkingCalendar(calendarId),
        dayRulesApi.listDayRules(calendarId),
        exceptionsApi.listExceptions(calendarId, { page: 0, size: 200 }),
      ])
      setCalendar(cal)
      setDayRules(
        padDayRules(
          rules.map((r) => ({
            dayOfWeek: r.dayOfWeek,
            isWorkingDay: r.isWorkingDay,
            startTime: r.startTime,
            endTime: r.endTime,
            workingHours: r.workingHours,
          }))
        )
      )
      setExceptions(exRes.items)
      setDirtyRules(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [calendarId])

  useEffect(() => {
    void load()
  }, [load])

  const updateDayRule = useCallback(
    (dayOfWeek: DayOfWeek, patch: Partial<DayRuleInput>) => {
      setDayRules((prev) =>
        padDayRules(prev).map((rule) =>
          rule.dayOfWeek === dayOfWeek ? { ...rule, ...patch } : rule
        )
      )
      setDirtyRules(true)
    },
    []
  )

  const saveDayRules = useCallback(async () => {
    if (!calendarId) return
    const rules = padDayRules(dayRules)
    if (!areDayRulesValid(rules)) {
      throw new Error('Working days require start/end times with end after start')
    }
    setSavingRules(true)
    try {
      const saved = await dayRulesApi.replaceDayRules(calendarId, { dayRules: rules })
      setDayRules(
        padDayRules(
          saved.map((r) => ({
            dayOfWeek: r.dayOfWeek,
            isWorkingDay: r.isWorkingDay,
            startTime: r.startTime,
            endTime: r.endTime,
            workingHours: r.workingHours,
          }))
        )
      )
      setDirtyRules(false)
    } finally {
      setSavingRules(false)
    }
  }, [calendarId, dayRules])

  const createException = useCallback(
    async (body: CreateCalendarExceptionPayload) => {
      if (!calendarId) return
      await exceptionsApi.createException(calendarId, body)
      await load()
    },
    [calendarId, load]
  )

  const removeException = useCallback(
    async (exceptionId: string) => {
      if (!calendarId) return
      await exceptionsApi.deleteException(calendarId, exceptionId)
      await load()
    },
    [calendarId, load]
  )

  return {
    calendar,
    dayRules,
    exceptions,
    loading,
    error,
    dirtyRules,
    savingRules,
    refetch: load,
    updateDayRule,
    saveDayRules,
    createException,
    removeException,
  }
}
