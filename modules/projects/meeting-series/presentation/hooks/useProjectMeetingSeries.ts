'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as meetingSeriesApi from '../../infrastructure/api/meeting-series.api'
import type { CreateMeetingSeriesPayload, MeetingSeries } from '../../domain/model/meeting-series'

export function useProjectMeetingSeries(projectId: string | null) {
  const [series, setSeries] = useState<MeetingSeries[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await meetingSeriesApi.listMeetingSeries(projectId)
      setSeries(res.items ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load meeting series')
      setSeries([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createSeries = useCallback(
    async (body: CreateMeetingSeriesPayload) => {
      if (!projectId) return null
      const created = await meetingSeriesApi.createMeetingSeries(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const pause = useCallback(
    async (seriesId: string) => {
      if (!projectId) return
      setActingId(seriesId)
      try {
        await meetingSeriesApi.pauseMeetingSeries(projectId, seriesId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const archive = useCallback(
    async (seriesId: string) => {
      if (!projectId) return
      setActingId(seriesId)
      try {
        await meetingSeriesApi.archiveMeetingSeries(projectId, seriesId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  return {
    series,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createSeries,
    pause,
    archive,
  }
}
