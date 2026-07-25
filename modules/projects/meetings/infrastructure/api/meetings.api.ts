import { apiClient } from '@/shared/lib/apiClient'
import { MEETING_ENDPOINTS } from './endpoints'
import type {
  AddParticipantPayload,
  CancelMeetingPayload,
  CreateMeetingPayload,
  ListMeetingsParams,
  Meeting,
  MeetingAgendaItem,
  MeetingListResponse,
  MeetingParticipant,
  UpdateMeetingPayload,
} from '../../domain/model/meeting'
import type {
  CreateMinutesPayload,
  MeetingMinutes,
  RejectMinutesPayload,
  UpdateMinutesPayload,
} from '../../domain/model/meeting-minutes'
import type {
  CompleteActionItemPayload,
  CreateActionItemPayload,
  MeetingActionItem,
  UpdateActionItemPayload,
} from '../../domain/model/meeting-action-item'
import type { MeetingNote, CreateNotePayload, UpdateNotePayload } from '../../domain/model/meeting-note'
import type { MeetingArtifactLink, CreateArtifactLinkPayload } from '../../domain/model/artifact-link'

export async function listMeetings(
  projectId: string,
  params?: ListMeetingsParams
): Promise<MeetingListResponse> {
  const res = await apiClient.get<Meeting[] | MeetingListResponse>(
    MEETING_ENDPOINTS.list(projectId, params)
  )
  return Array.isArray(res) ? { items: res } : res
}

export async function getMeeting(projectId: string, meetingId: string): Promise<Meeting> {
  return apiClient.get<Meeting>(MEETING_ENDPOINTS.get(projectId, meetingId))
}

export async function createMeeting(
  projectId: string,
  body: CreateMeetingPayload
): Promise<Meeting> {
  return apiClient.post<Meeting>(MEETING_ENDPOINTS.create(projectId), body)
}

export async function updateMeeting(
  projectId: string,
  meetingId: string,
  body: UpdateMeetingPayload
): Promise<Meeting> {
  return apiClient.put<Meeting>(MEETING_ENDPOINTS.update(projectId, meetingId), body)
}

export async function startMeeting(projectId: string, meetingId: string): Promise<Meeting> {
  return apiClient.post<Meeting>(MEETING_ENDPOINTS.start(projectId, meetingId))
}

export async function completeMeeting(projectId: string, meetingId: string): Promise<Meeting> {
  return apiClient.post<Meeting>(MEETING_ENDPOINTS.complete(projectId, meetingId))
}

export async function cancelMeeting(
  projectId: string,
  meetingId: string,
  body?: CancelMeetingPayload
): Promise<Meeting> {
  return apiClient.post<Meeting>(MEETING_ENDPOINTS.cancel(projectId, meetingId), body)
}

export async function archiveMeeting(projectId: string, meetingId: string): Promise<Meeting> {
  return apiClient.patch<Meeting>(MEETING_ENDPOINTS.archive(projectId, meetingId))
}

export async function listAgendaItems(
  projectId: string,
  meetingId: string
): Promise<MeetingAgendaItem[]> {
  return apiClient.get<MeetingAgendaItem[]>(MEETING_ENDPOINTS.agendaItems.list(projectId, meetingId))
}

export interface CreateAgendaItemPayload {
  title: string
  description?: string | null
  ownerUserId?: string | null
  sortOrder?: number
  timeboxMinutes?: number | null
  clientVisible?: boolean
}

export async function createAgendaItem(
  projectId: string,
  meetingId: string,
  body: CreateAgendaItemPayload
): Promise<MeetingAgendaItem> {
  return apiClient.post<MeetingAgendaItem>(
    MEETING_ENDPOINTS.agendaItems.create(projectId, meetingId),
    body
  )
}

export async function updateAgendaItem(
  projectId: string,
  meetingId: string,
  agendaItemId: string,
  body: {
    title?: string
    description?: string | null
    ownerUserId?: string | null
    timeboxMinutes?: number | null
    durationMinutes?: number | null
  }
): Promise<MeetingAgendaItem> {
  return apiClient.patch<MeetingAgendaItem>(
    MEETING_ENDPOINTS.agendaItems.update(projectId, meetingId, agendaItemId),
    body
  )
}

export async function deleteAgendaItem(
  projectId: string,
  meetingId: string,
  agendaItemId: string
): Promise<void> {
  await apiClient.delete<void>(
    MEETING_ENDPOINTS.agendaItems.delete(projectId, meetingId, agendaItemId),
    { parseJson: false }
  )
}

export async function reorderAgendaItems(
  projectId: string,
  meetingId: string,
  body: { orderedIds: string[] }
): Promise<unknown> {
  return apiClient.post<unknown>(MEETING_ENDPOINTS.agendaItems.reorder(projectId, meetingId), body)
}

export async function listParticipants(
  projectId: string,
  meetingId: string
): Promise<MeetingParticipant[]> {
  return apiClient.get<MeetingParticipant[]>(
    MEETING_ENDPOINTS.participants.list(projectId, meetingId)
  )
}

export async function addParticipant(
  projectId: string,
  meetingId: string,
  body: AddParticipantPayload
): Promise<MeetingParticipant> {
  return apiClient.post<MeetingParticipant>(
    MEETING_ENDPOINTS.participants.create(projectId, meetingId),
    body
  )
}

export async function updateParticipant(
  projectId: string,
  meetingId: string,
  participantId: string,
  body: { role?: string; notes?: string | null }
): Promise<MeetingParticipant> {
  return apiClient.patch<MeetingParticipant>(
    MEETING_ENDPOINTS.participants.update(projectId, meetingId, participantId),
    body
  )
}

export async function removeParticipant(
  projectId: string,
  meetingId: string,
  participantId: string
): Promise<void> {
  await apiClient.delete<void>(
    MEETING_ENDPOINTS.participants.remove(projectId, meetingId, participantId),
    { parseJson: false }
  )
}

export async function markParticipantAttended(
  projectId: string,
  meetingId: string,
  participantId: string
): Promise<MeetingParticipant> {
  return apiClient.post<MeetingParticipant>(
    MEETING_ENDPOINTS.participants.markAttended(projectId, meetingId, participantId)
  )
}

export async function listMinutes(
  projectId: string,
  meetingId: string
): Promise<MeetingMinutes[]> {
  return apiClient.get<MeetingMinutes[]>(MEETING_ENDPOINTS.minutes.list(projectId, meetingId))
}

export async function createMinutes(
  projectId: string,
  meetingId: string,
  body: CreateMinutesPayload
): Promise<MeetingMinutes> {
  return apiClient.post<MeetingMinutes>(
    MEETING_ENDPOINTS.minutes.create(projectId, meetingId),
    body
  )
}

export async function updateMinutes(
  projectId: string,
  meetingId: string,
  minutesId: string,
  body: UpdateMinutesPayload
): Promise<MeetingMinutes> {
  return apiClient.put<MeetingMinutes>(
    MEETING_ENDPOINTS.minutes.update(projectId, meetingId, minutesId),
    body
  )
}

export async function submitMinutesForReview(
  projectId: string,
  meetingId: string,
  minutesId: string
): Promise<MeetingMinutes> {
  return apiClient.post<MeetingMinutes>(
    MEETING_ENDPOINTS.minutes.submitReview(projectId, meetingId, minutesId)
  )
}

export async function approveMinutes(
  projectId: string,
  meetingId: string,
  minutesId: string
): Promise<MeetingMinutes> {
  return apiClient.post<MeetingMinutes>(
    MEETING_ENDPOINTS.minutes.approve(projectId, meetingId, minutesId)
  )
}

export async function rejectMinutes(
  projectId: string,
  meetingId: string,
  minutesId: string,
  body?: RejectMinutesPayload
): Promise<MeetingMinutes> {
  return apiClient.post<MeetingMinutes>(
    MEETING_ENDPOINTS.minutes.reject(projectId, meetingId, minutesId),
    body
  )
}

export async function generateMinutesDocument(
  projectId: string,
  meetingId: string,
  minutesId: string
): Promise<MeetingMinutes> {
  return apiClient.post<MeetingMinutes>(
    MEETING_ENDPOINTS.minutes.generateDocument(projectId, meetingId, minutesId)
  )
}

export async function listActionItems(
  projectId: string,
  meetingId: string
): Promise<MeetingActionItem[]> {
  return apiClient.get<MeetingActionItem[]>(
    MEETING_ENDPOINTS.actionItems.list(projectId, meetingId)
  )
}

export async function createActionItem(
  projectId: string,
  meetingId: string,
  body: CreateActionItemPayload
): Promise<MeetingActionItem> {
  return apiClient.post<MeetingActionItem>(
    MEETING_ENDPOINTS.actionItems.create(projectId, meetingId),
    body
  )
}

export async function getActionItem(
  projectId: string,
  actionItemId: string
): Promise<MeetingActionItem> {
  return apiClient.get<MeetingActionItem>(MEETING_ENDPOINTS.actionItems.get(projectId, actionItemId))
}

export async function updateActionItem(
  projectId: string,
  actionItemId: string,
  body: UpdateActionItemPayload
): Promise<MeetingActionItem> {
  return apiClient.put<MeetingActionItem>(
    MEETING_ENDPOINTS.actionItems.update(projectId, actionItemId),
    body
  )
}

export async function completeActionItem(
  projectId: string,
  actionItemId: string,
  body?: CompleteActionItemPayload
): Promise<MeetingActionItem> {
  return apiClient.post<MeetingActionItem>(
    MEETING_ENDPOINTS.actionItems.complete(projectId, actionItemId),
    body
  )
}

export async function archiveActionItem(
  projectId: string,
  actionItemId: string
): Promise<MeetingActionItem> {
  return apiClient.patch<MeetingActionItem>(
    MEETING_ENDPOINTS.actionItems.archive(projectId, actionItemId)
  )
}

export async function createLinkedTaskFromActionItem(
  projectId: string,
  actionItemId: string,
  body?: { title?: string }
): Promise<{ taskId: string }> {
  return apiClient.post<{ taskId: string }>(
    MEETING_ENDPOINTS.actionItems.createLinkedTask(projectId, actionItemId),
    body
  )
}

// Meeting Notes

export async function listNotes(projectId: string, meetingId: string): Promise<MeetingNote[]> {
  return apiClient.get<MeetingNote[]>(MEETING_ENDPOINTS.notes.list(projectId, meetingId))
}

export async function createNote(
  projectId: string,
  meetingId: string,
  body: CreateNotePayload
): Promise<MeetingNote> {
  return apiClient.post<MeetingNote>(MEETING_ENDPOINTS.notes.create(projectId, meetingId), body)
}

export async function updateNote(
  projectId: string,
  meetingId: string,
  noteId: string,
  body: UpdateNotePayload
): Promise<MeetingNote> {
  return apiClient.put<MeetingNote>(
    MEETING_ENDPOINTS.notes.update(projectId, meetingId, noteId),
    body
  )
}

export async function archiveNote(
  projectId: string,
  meetingId: string,
  noteId: string
): Promise<void> {
  await apiClient.patch<void>(MEETING_ENDPOINTS.notes.archive(projectId, meetingId, noteId))
}

export async function convertNoteToDecision(
  projectId: string,
  meetingId: string,
  noteId: string,
  body?: Record<string, unknown>
): Promise<{ entityId: string }> {
  return apiClient.post<{ entityId: string }>(
    MEETING_ENDPOINTS.notes.convertToDecision(projectId, meetingId, noteId),
    body
  )
}

export async function convertNoteToRaidItem(
  projectId: string,
  meetingId: string,
  noteId: string,
  body: { type: string }
): Promise<{ entityId: string }> {
  return apiClient.post<{ entityId: string }>(
    MEETING_ENDPOINTS.notes.convertToRaidItem(projectId, meetingId, noteId),
    body
  )
}

export async function convertNoteToRequirement(
  projectId: string,
  meetingId: string,
  noteId: string,
  body?: Record<string, unknown>
): Promise<{ entityId: string }> {
  return apiClient.post<{ entityId: string }>(
    MEETING_ENDPOINTS.notes.convertToRequirement(projectId, meetingId, noteId),
    body
  )
}

export async function convertNoteToChangeRequest(
  projectId: string,
  meetingId: string,
  noteId: string,
  body?: Record<string, unknown>
): Promise<{ entityId: string }> {
  return apiClient.post<{ entityId: string }>(
    MEETING_ENDPOINTS.notes.convertToChangeRequest(projectId, meetingId, noteId),
    body
  )
}

// Meeting Artifact Links

export async function listArtifactLinks(
  projectId: string,
  meetingId: string
): Promise<MeetingArtifactLink[]> {
  return apiClient.get<MeetingArtifactLink[]>(
    MEETING_ENDPOINTS.artifactLinks.list(projectId, meetingId)
  )
}

export async function createArtifactLink(
  projectId: string,
  meetingId: string,
  body: CreateArtifactLinkPayload
): Promise<MeetingArtifactLink> {
  return apiClient.post<MeetingArtifactLink>(
    MEETING_ENDPOINTS.artifactLinks.create(projectId, meetingId),
    body
  )
}

export async function deleteArtifactLink(
  projectId: string,
  meetingId: string,
  linkId: string
): Promise<void> {
  await apiClient.delete<void>(
    MEETING_ENDPOINTS.artifactLinks.delete(projectId, meetingId, linkId),
    { parseJson: false }
  )
}
