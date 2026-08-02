import { apiClient } from '@/shared/lib/apiClient'
import { apiPath } from '@/shared/lib/api-paths'
import type { TimelineGranularity } from '../../domain/enums/timeline.enum'

export const TIMELINE_ENDPOINTS = {
  view: (
    projectId: string,
    params: { from: string; to: string; granularity: TimelineGranularity }
  ) => {
    const q = new URLSearchParams({
      from: params.from,
      to: params.to,
      granularity: params.granularity,
    })
    return apiPath(`/projects/${projectId}/timeline?${q}`)
  },
  dailyAllocations: (projectId: string, taskId: string) =>
    apiPath(`/projects/${projectId}/tasks/${taskId}/daily-allocations`),
} as const

export interface TimelineBucketDto {
  periodStart: string
  periodEnd: string
  plannedMinutes: number
  plannedContributionPercent: number | null
  cumulativePlannedPercent: number | null
  actualProgressPercent: number | null
  variancePercent: number | null
}

export interface TimelineTaskItemDto {
  taskId: string
  estimateMinutes: number | null
  progressPercent: number | null
  startDate: string | null
  endDate: string | null
  buckets: TimelineBucketDto[]
}

export interface TimelineViewDto {
  items: TimelineTaskItemDto[]
}

export async function getTimelineView(
  projectId: string,
  params: { from: string; to: string; granularity: TimelineGranularity }
): Promise<TimelineViewDto> {
  return apiClient.get<TimelineViewDto>(TIMELINE_ENDPOINTS.view(projectId, params), {
    skipErrorToast: true,
  })
}

export async function replaceDailyAllocations(
  projectId: string,
  taskId: string,
  items: Array<{ workDate: string; plannedMinutes: number }>
): Promise<void> {
  await apiClient.put(
    TIMELINE_ENDPOINTS.dailyAllocations(projectId, taskId),
    { items },
    { skipErrorToast: true }
  )
}
