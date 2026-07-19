export const SeriesStatus = {
  Active: 'ACTIVE',
  Paused: 'PAUSED',
  Archived: 'ARCHIVED',
} as const
export type SeriesStatus = (typeof SeriesStatus)[keyof typeof SeriesStatus]
