import { apiClient } from '@/shared/lib/apiClient'
import { SCHEDULE_ENDPOINTS } from './endpoints'
import type {
  CreateScheduleRunPayload,
  DailyWorkEntry,
  DailyWorkParams,
  ScheduleIssue,
  ScheduleRun,
  TaskSchedule,
  TaskScheduleDetail,
  TaskScheduleParams,
} from '../../domain/model/schedule'

export async function listScheduleRuns(projectId: string): Promise<ScheduleRun[]> {
  return apiClient.get<ScheduleRun[]>(SCHEDULE_ENDPOINTS.runs.list(projectId))
}

export async function createScheduleRun(
  projectId: string,
  body: CreateScheduleRunPayload
): Promise<ScheduleRun> {
  return apiClient.post<ScheduleRun>(SCHEDULE_ENDPOINTS.runs.create(projectId), body)
}

export async function getScheduleRun(
  projectId: string,
  scheduleRunId: string
): Promise<ScheduleRun> {
  return apiClient.get<ScheduleRun>(SCHEDULE_ENDPOINTS.runs.get(projectId, scheduleRunId))
}

export async function cancelScheduleRun(
  projectId: string,
  scheduleRunId: string
): Promise<ScheduleRun> {
  return apiClient.post<ScheduleRun>(SCHEDULE_ENDPOINTS.runs.cancel(projectId, scheduleRunId))
}

export async function getCurrentSchedule(projectId: string): Promise<ScheduleRun> {
  return apiClient.get<ScheduleRun>(SCHEDULE_ENDPOINTS.current.get(projectId))
}

export async function getCurrentScheduleTasks(
  projectId: string,
  params?: TaskScheduleParams
): Promise<TaskSchedule[]> {
  return apiClient.get<TaskSchedule[]>(SCHEDULE_ENDPOINTS.current.tasks(projectId, params))
}

export async function getCurrentScheduleDailyWork(
  projectId: string,
  params?: DailyWorkParams
): Promise<DailyWorkEntry[]> {
  return apiClient.get<DailyWorkEntry[]>(SCHEDULE_ENDPOINTS.current.dailyWork(projectId, params))
}

export async function getCurrentScheduleIssues(projectId: string): Promise<ScheduleIssue[]> {
  return apiClient.get<ScheduleIssue[]>(SCHEDULE_ENDPOINTS.current.issues(projectId))
}

export async function getTaskSchedule(
  projectId: string,
  taskId: string
): Promise<TaskScheduleDetail> {
  return apiClient.get<TaskScheduleDetail>(SCHEDULE_ENDPOINTS.taskSchedule.get(projectId, taskId))
}

export async function getTaskScheduleHistory(
  projectId: string,
  taskId: string
): Promise<TaskScheduleDetail[]> {
  return apiClient.get<TaskScheduleDetail[]>(
    SCHEDULE_ENDPOINTS.taskSchedule.history(projectId, taskId)
  )
}
