import { apiClient } from '@/shared/lib/apiClient'
import { MEETING_SERIES_ENDPOINTS } from './endpoints'
import type {
  CreateMeetingSeriesPayload,
  MeetingSeries,
  UpdateMeetingSeriesPayload,
} from '../../domain/model/meeting-series'

export interface MeetingSeriesListResponse {
  items: MeetingSeries[]
}

export async function listMeetingSeries(
  projectId: string
): Promise<MeetingSeriesListResponse> {
  const res = await apiClient.get<MeetingSeries[] | MeetingSeriesListResponse>(
    MEETING_SERIES_ENDPOINTS.list(projectId)
  )
  return Array.isArray(res) ? { items: res } : res
}

export async function getMeetingSeries(
  projectId: string,
  seriesId: string
): Promise<MeetingSeries> {
  return apiClient.get<MeetingSeries>(MEETING_SERIES_ENDPOINTS.get(projectId, seriesId))
}

export async function createMeetingSeries(
  projectId: string,
  body: CreateMeetingSeriesPayload
): Promise<MeetingSeries> {
  return apiClient.post<MeetingSeries>(MEETING_SERIES_ENDPOINTS.create(projectId), body)
}

export async function updateMeetingSeries(
  projectId: string,
  seriesId: string,
  body: UpdateMeetingSeriesPayload
): Promise<MeetingSeries> {
  return apiClient.patch<MeetingSeries>(MEETING_SERIES_ENDPOINTS.update(projectId, seriesId), body)
}

export async function pauseMeetingSeries(
  projectId: string,
  seriesId: string
): Promise<MeetingSeries> {
  return apiClient.post<MeetingSeries>(MEETING_SERIES_ENDPOINTS.pause(projectId, seriesId))
}

export async function archiveMeetingSeries(
  projectId: string,
  seriesId: string
): Promise<MeetingSeries> {
  return apiClient.patch<MeetingSeries>(MEETING_SERIES_ENDPOINTS.archive(projectId, seriesId))
}
