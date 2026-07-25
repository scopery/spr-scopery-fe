'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as meetingsApi from '../../infrastructure/api/meetings.api'
import type {
  AddParticipantPayload,
  Meeting,
  MeetingAgendaItem,
  MeetingParticipant,
} from '../../domain/model/meeting'
import type {
  CreateMinutesPayload,
  MeetingMinutes,
  UpdateMinutesPayload,
} from '../../domain/model/meeting-minutes'
import type {
  CompleteActionItemPayload,
  CreateActionItemPayload,
  MeetingActionItem,
  UpdateActionItemPayload,
} from '../../domain/model/meeting-action-item'
import type { MeetingLifecycleAction } from '../../domain/rules/meeting.rules'
import type { MeetingNote, CreateNotePayload, UpdateNotePayload } from '../../domain/model/meeting-note'
import type { MeetingArtifactLink, CreateArtifactLinkPayload } from '../../domain/model/artifact-link'

export function useMeetingDetail(projectId: string | null, meetingId: string | null) {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [agendaItems, setAgendaItems] = useState<MeetingAgendaItem[]>([])
  const [participants, setParticipants] = useState<MeetingParticipant[]>([])
  const [minutesList, setMinutesList] = useState<MeetingMinutes[]>([])
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>([])
  const [notes, setNotes] = useState<MeetingNote[]>([])
  const [artifactLinks, setArtifactLinks] = useState<MeetingArtifactLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !meetingId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [meetingRes, agendaRes, participantsRes, minutesRes, actionItemsRes, notesRes, artifactLinksRes] =
        await Promise.all([
          meetingsApi.getMeeting(projectId, meetingId),
          meetingsApi.listAgendaItems(projectId, meetingId).catch(() => []),
          meetingsApi.listParticipants(projectId, meetingId).catch(() => []),
          meetingsApi.listMinutes(projectId, meetingId).catch(() => []),
          meetingsApi.listActionItems(projectId, meetingId).catch(() => []),
          meetingsApi.listNotes(projectId, meetingId).catch(() => []),
          meetingsApi.listArtifactLinks(projectId, meetingId).catch(() => []),
        ])
      setMeeting(meetingRes)
      setNotes(notesRes ?? [])
      setArtifactLinks(artifactLinksRes ?? [])
      setAgendaItems(agendaRes ?? [])
      setParticipants(participantsRes ?? [])
      setMinutesList(minutesRes ?? [])
      setActionItems(actionItemsRes ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load meeting')
      setMeeting(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, meetingId])

  useEffect(() => {
    void load()
  }, [load])

  const runLifecycle = useCallback(
    async (action: MeetingLifecycleAction, reason?: string) => {
      if (!projectId || !meetingId) return
      setActing(true)
      try {
        if (action === 'start') await meetingsApi.startMeeting(projectId, meetingId)
        else if (action === 'complete') await meetingsApi.completeMeeting(projectId, meetingId)
        else if (action === 'cancel')
          await meetingsApi.cancelMeeting(projectId, meetingId, { reason })
        else await meetingsApi.archiveMeeting(projectId, meetingId)
        await load()
      } finally {
        setActing(false)
      }
    },
    [projectId, meetingId, load]
  )

  const addParticipant = useCallback(
    async (body: AddParticipantPayload) => {
      if (!projectId || !meetingId) return null
      const created = await meetingsApi.addParticipant(projectId, meetingId, body)
      await load()
      return created
    },
    [projectId, meetingId, load]
  )

  const latestMinutes = minutesList.length > 0 ? minutesList[minutesList.length - 1] : null

  const saveMinutes = useCallback(
    async (body: CreateMinutesPayload | UpdateMinutesPayload, opts?: { quiet?: boolean }) => {
      if (!projectId || !meetingId) return null
      const result = latestMinutes
        ? await meetingsApi.updateMinutes(projectId, meetingId, latestMinutes.id, body)
        : await meetingsApi.createMinutes(projectId, meetingId, body as CreateMinutesPayload)
      if (opts?.quiet) {
        setMinutesList((prev) => {
          const idx = prev.findIndex((m) => m.id === result.id)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = result
            return next
          }
          return [...prev, result]
        })
      } else {
        await load()
      }
      return result
    },
    [projectId, meetingId, latestMinutes, load]
  )

  const submitMinutesForReview = useCallback(async () => {
    if (!projectId || !meetingId || !latestMinutes) return null
    const result = await meetingsApi.submitMinutesForReview(
      projectId,
      meetingId,
      latestMinutes.id
    )
    await load()
    return result
  }, [projectId, meetingId, latestMinutes, load])

  const approveMinutes = useCallback(async () => {
    if (!projectId || !meetingId || !latestMinutes) return null
    const result = await meetingsApi.approveMinutes(projectId, meetingId, latestMinutes.id)
    await load()
    return result
  }, [projectId, meetingId, latestMinutes, load])

  const rejectMinutes = useCallback(
    async (reason?: string) => {
      if (!projectId || !meetingId || !latestMinutes) return null
      const result = await meetingsApi.rejectMinutes(projectId, meetingId, latestMinutes.id, {
        reason,
      })
      await load()
      return result
    },
    [projectId, meetingId, latestMinutes, load]
  )

  const createActionItem = useCallback(
    async (body: CreateActionItemPayload, opts?: { quiet?: boolean }) => {
      if (!projectId || !meetingId) return null
      const created = await meetingsApi.createActionItem(projectId, meetingId, body)
      if (opts?.quiet) {
        setActionItems((prev) => [...prev, created])
      } else {
        await load()
      }
      return created
    },
    [projectId, meetingId, load]
  )

  const completeActionItem = useCallback(
    async (actionItemId: string, body?: CompleteActionItemPayload) => {
      if (!projectId) return null
      const result = await meetingsApi.completeActionItem(projectId, actionItemId, body)
      await load()
      return result
    },
    [projectId, load]
  )

  const updateActionItem = useCallback(
    async (actionItemId: string, body: UpdateActionItemPayload) => {
      if (!projectId) return null
      const result = await meetingsApi.updateActionItem(projectId, actionItemId, body)
      await load()
      return result
    },
    [projectId, load]
  )

  const archiveActionItem = useCallback(
    async (actionItemId: string) => {
      if (!projectId) return null
      const result = await meetingsApi.archiveActionItem(projectId, actionItemId)
      await load()
      return result
    },
    [projectId, load]
  )

  const updateAgendaItem = useCallback(
    async (
      agendaItemId: string,
      body: {
        title?: string
        description?: string | null
        ownerUserId?: string | null
        timeboxMinutes?: number | null
        durationMinutes?: number | null
      }
    ) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.updateAgendaItem(projectId, meetingId, agendaItemId, body)
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const createAgendaItem = useCallback(
    async (body: {
      title: string
      description?: string | null
      ownerUserId?: string | null
      sortOrder?: number
      timeboxMinutes?: number | null
    }) => {
      if (!projectId || !meetingId) return null
      const created = await meetingsApi.createAgendaItem(projectId, meetingId, body)
      await load()
      return created
    },
    [projectId, meetingId, load]
  )

  const deleteAgendaItem = useCallback(
    async (agendaItemId: string) => {
      if (!projectId || !meetingId) return
      await meetingsApi.deleteAgendaItem(projectId, meetingId, agendaItemId)
      await load()
    },
    [projectId, meetingId, load]
  )

  const reorderAgendaItems = useCallback(
    async (orderedIds: string[]) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.reorderAgendaItems(projectId, meetingId, { orderedIds })
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const updateParticipant = useCallback(
    async (participantId: string, body: { role?: string; notes?: string | null }) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.updateParticipant(
        projectId,
        meetingId,
        participantId,
        body
      )
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const removeParticipant = useCallback(
    async (participantId: string) => {
      if (!projectId || !meetingId) return
      await meetingsApi.removeParticipant(projectId, meetingId, participantId)
      await load()
    },
    [projectId, meetingId, load]
  )

  const markParticipantAttended = useCallback(
    async (participantId: string) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.markParticipantAttended(projectId, meetingId, participantId)
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const generateMinutesDocument = useCallback(
    async (minutesId: string) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.generateMinutesDocument(projectId, meetingId, minutesId)
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const createLinkedTaskFromActionItem = useCallback(
    async (actionItemId: string, body?: { title?: string }) => {
      if (!projectId) return null
      return meetingsApi.createLinkedTaskFromActionItem(projectId, actionItemId, body)
    },
    [projectId]
  )

  const createNote = useCallback(
    async (body: CreateNotePayload) => {
      if (!projectId || !meetingId) return null
      const created = await meetingsApi.createNote(projectId, meetingId, body)
      setNotes((prev) => [...prev, created])
      return created
    },
    [projectId, meetingId]
  )

  const updateNote = useCallback(
    async (noteId: string, body: UpdateNotePayload) => {
      if (!projectId || !meetingId) return null
      const updated = await meetingsApi.updateNote(projectId, meetingId, noteId, body)
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)))
      return updated
    },
    [projectId, meetingId]
  )

  const archiveNote = useCallback(
    async (noteId: string) => {
      if (!projectId || !meetingId) return
      await meetingsApi.archiveNote(projectId, meetingId, noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    },
    [projectId, meetingId]
  )

  const convertNoteToDecision = useCallback(
    async (noteId: string, body?: Record<string, unknown>) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.convertNoteToDecision(projectId, meetingId, noteId, body)
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const convertNoteToRaidItem = useCallback(
    async (noteId: string, body: { type: string }) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.convertNoteToRaidItem(projectId, meetingId, noteId, body)
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const convertNoteToRequirement = useCallback(
    async (noteId: string, body?: Record<string, unknown>) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.convertNoteToRequirement(projectId, meetingId, noteId, body)
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const convertNoteToChangeRequest = useCallback(
    async (noteId: string, body?: Record<string, unknown>) => {
      if (!projectId || !meetingId) return null
      const result = await meetingsApi.convertNoteToChangeRequest(projectId, meetingId, noteId, body)
      await load()
      return result
    },
    [projectId, meetingId, load]
  )

  const addArtifactLink = useCallback(
    async (body: CreateArtifactLinkPayload) => {
      if (!projectId || !meetingId) return null
      const created = await meetingsApi.createArtifactLink(projectId, meetingId, body)
      setArtifactLinks((prev) => [...prev, created])
      return created
    },
    [projectId, meetingId]
  )

  const removeArtifactLink = useCallback(
    async (linkId: string) => {
      if (!projectId || !meetingId) return
      await meetingsApi.deleteArtifactLink(projectId, meetingId, linkId)
      setArtifactLinks((prev) => prev.filter((l) => l.id !== linkId))
    },
    [projectId, meetingId]
  )

  return {
    meeting,
    notes,
    artifactLinks,
    agendaItems,
    participants,
    minutesList,
    latestMinutes,
    actionItems,
    loading,
    error,
    forbidden,
    acting,
    refetch: load,
    runLifecycle,
    addParticipant,
    saveMinutes,
    submitMinutesForReview,
    approveMinutes,
    rejectMinutes,
    createActionItem,
    completeActionItem,
    updateActionItem,
    archiveActionItem,
    updateAgendaItem,
    createAgendaItem,
    deleteAgendaItem,
    reorderAgendaItems,
    updateParticipant,
    removeParticipant,
    markParticipantAttended,
    generateMinutesDocument,
    createLinkedTaskFromActionItem,
    createNote,
    updateNote,
    archiveNote,
    convertNoteToDecision,
    convertNoteToRaidItem,
    convertNoteToRequirement,
    convertNoteToChangeRequest,
    addArtifactLink,
    removeArtifactLink,
  }
}
