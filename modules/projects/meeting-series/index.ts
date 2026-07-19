export { MeetingSeriesView } from './presentation/ui/MeetingSeriesView'
export { CreateMeetingSeriesModal } from './presentation/ui/CreateMeetingSeriesModal'
export { useProjectMeetingSeries } from './presentation/hooks/useProjectMeetingSeries'
export * as meetingSeriesApi from './infrastructure/api/meeting-series.api'
export { SeriesStatus } from './domain/enums/meeting-series.enum'
export type { SeriesStatus as SeriesStatusType } from './domain/enums/meeting-series.enum'
export type {
  MeetingSeries,
  CreateMeetingSeriesPayload,
  UpdateMeetingSeriesPayload,
} from './domain/model/meeting-series'
