'use client'

import { useCallback, useEffect, useState } from 'react'
import * as calendarsApi from '../../infrastructure/api/calendars.api'
import type {
  CreateWorkingCalendarPayload,
  WorkingCalendar,
} from '../../domain/model/working-calendar'

export function useWorkingCalendars(workspaceId: string | null) {
  const [items, setItems] = useState<WorkingCalendar[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await calendarsApi.listWorkingCalendars({
        workspaceId,
        page: 0,
        size: 100,
      })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendars')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createCalendar = useCallback(
    async (body: CreateWorkingCalendarPayload) => {
      if (!workspaceId) return
      setCreating(true)
      try {
        await calendarsApi.createWorkingCalendar(workspaceId, body)
        await load()
      } finally {
        setCreating(false)
      }
    },
    [workspaceId, load]
  )

  const setDefault = useCallback(
    async (calendarId: string) => {
      await calendarsApi.setDefaultWorkingCalendar(calendarId)
      await load()
    },
    [load]
  )

  const activate = useCallback(
    async (calendarId: string) => {
      await calendarsApi.activateWorkingCalendar(calendarId)
      await load()
    },
    [load]
  )

  const deactivate = useCallback(
    async (calendarId: string) => {
      await calendarsApi.deactivateWorkingCalendar(calendarId)
      await load()
    },
    [load]
  )

  const archive = useCallback(
    async (calendarId: string) => {
      await calendarsApi.archiveWorkingCalendar(calendarId)
      await load()
    },
    [load]
  )

  return {
    items,
    loading,
    error,
    creating,
    refetch: load,
    createCalendar,
    setDefault,
    activate,
    deactivate,
    archive,
  }
}
