import type { MeetingMinutesStatus } from '../enums/meeting.enum'

export interface MeetingMinutes {
  id: string
  meetingId: string
  status: MeetingMinutesStatus | string
  summary: string | null
  decisionsSummary: string | null
  actionsSummary: string | null
  clientVisibleSummary: string | null
  documentId: string | null
  documentVersionId: string | null
  submittedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

export interface CreateMinutesPayload {
  summary?: string | null
  decisionsSummary?: string | null
  actionsSummary?: string | null
  clientVisibleSummary?: string | null
}

export interface UpdateMinutesPayload {
  summary?: string | null
  decisionsSummary?: string | null
  actionsSummary?: string | null
  clientVisibleSummary?: string | null
}

export interface RejectMinutesPayload {
  reason?: string | null
}
