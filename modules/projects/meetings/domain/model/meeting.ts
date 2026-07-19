import type { MeetingStatus } from '../enums/meeting.enum'

export interface Meeting {
  id: string
  workspaceId: string
  projectId: string
  meetingSeriesId: string | null
  title: string
  description: string | null
  meetingType: string | null
  status: MeetingStatus | string
  startAt: string
  endAt: string | null
  timezone: string | null
  location: string | null
  meetingUrl: string | null
  organizerUserId: string | null
  clientVisible: boolean
  internalOnly: boolean
  cancelledAt: string | null
  cancelReason: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface CreateMeetingPayload {
  meetingSeriesId?: string | null
  title: string
  description?: string | null
  meetingType?: string | null
  startAt: string
  endAt?: string | null
  timezone?: string | null
  location?: string | null
  meetingUrl?: string | null
  organizerUserId?: string | null
  clientVisible?: boolean
}

export interface UpdateMeetingPayload {
  title?: string
  description?: string | null
  meetingType?: string | null
  startAt?: string
  endAt?: string | null
  timezone?: string | null
  location?: string | null
  meetingUrl?: string | null
  organizerUserId?: string | null
  clientVisible?: boolean
}

export interface CancelMeetingPayload {
  reason?: string | null
}

export interface MeetingListResponse {
  items: Meeting[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
  first?: boolean
  last?: boolean
}

export interface ListMeetingsParams {
  page?: number
  size?: number
}

export interface MeetingAgendaItem {
  id: string
  meetingId: string
  title: string
  description: string | null
  ownerUserId: string | null
  status: string
  sortOrder: number
  timeboxMinutes: number | null
  clientVisible: boolean
}

export interface MeetingParticipant {
  id: string
  meetingId: string
  targetType: string
  targetId: string
  displayNameSnapshot: string | null
  emailSnapshot: string | null
  participantRole: string
  attendanceStatus: string
  clientVisible: boolean
  createdAt: string
}

export interface AddParticipantPayload {
  targetType: string
  targetId: string
  displayName?: string | null
  email?: string | null
  participantRole?: string
  clientVisible?: boolean
}
