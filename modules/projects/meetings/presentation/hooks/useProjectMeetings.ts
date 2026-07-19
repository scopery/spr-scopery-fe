'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as meetingsApi from '../../infrastructure/api/meetings.api'
import type { CreateMeetingPayload, Meeting } from '../../domain/model/meeting'
import type { MeetingLifecycleAction } from '../../domain/rules/meeting.rules'

export function useProjectMeetings(projectId: string | null) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
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
      const res = await meetingsApi.listMeetings(projectId, { page: 0, size: 200 })
      setMeetings(res.items ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
      setMeetings([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createMeeting = useCallback(
    async (body: CreateMeetingPayload) => {
      if (!projectId) return null
      const created = await meetingsApi.createMeeting(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const runLifecycle = useCallback(
    async (meetingId: string, action: MeetingLifecycleAction, reason?: string) => {
      if (!projectId) return
      setActingId(meetingId)
      try {
        if (action === 'start') await meetingsApi.startMeeting(projectId, meetingId)
        else if (action === 'complete') await meetingsApi.completeMeeting(projectId, meetingId)
        else if (action === 'cancel')
          await meetingsApi.cancelMeeting(projectId, meetingId, { reason })
        else await meetingsApi.archiveMeeting(projectId, meetingId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  return {
    meetings,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createMeeting,
    runLifecycle,
  }
}
