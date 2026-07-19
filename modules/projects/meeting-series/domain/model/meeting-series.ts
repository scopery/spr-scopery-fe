import type { SeriesStatus } from '../enums/meeting-series.enum'

export interface MeetingSeries {
  id: string
  projectId: string
  title: string
  recurrenceRule: string
  status: SeriesStatus | string
  nextOccurrenceAt: string | null
  createdAt: string
}

export interface CreateMeetingSeriesPayload {
  title: string
  recurrenceRule: string
}

export interface UpdateMeetingSeriesPayload {
  title?: string
  recurrenceRule?: string
}
