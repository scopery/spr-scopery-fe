import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/shared/lib/api-types'
import { apiPath } from '@/shared/lib/api-paths'
import type {
  CreateProgressSnapshotPayload,
  TaskProgressSnapshot,
} from '../../domain/model/progress-snapshot'
import {
  createLocalProgressSnapshot,
  listLocalProgressSnapshots,
} from './progress-snapshot.local'

export const PROGRESS_SNAPSHOT_ENDPOINTS = {
  list: (projectId: string, taskId: string) =>
    apiPath(`/projects/${projectId}/tasks/${taskId}/progress-snapshots`),
  create: (projectId: string, taskId: string) =>
    apiPath(`/projects/${projectId}/tasks/${taskId}/progress-snapshots`),
  listProject: (projectId: string) =>
    apiPath(`/projects/${projectId}/progress-snapshots`),
} as const

/**
 * Prefer BE when available; fall back to localStorage interim store on 404/501.
 */
export async function listProgressSnapshotsForProject(
  projectId: string,
  taskIds: string[]
): Promise<{ items: TaskProgressSnapshot[]; source: 'api' | 'local' }> {
  try {
    const res = await apiClient.get<{ items: TaskProgressSnapshot[] }>(
      PROGRESS_SNAPSHOT_ENDPOINTS.listProject(projectId),
      { skipErrorToast: true }
    )
    return { items: res.items ?? [], source: 'api' }
  } catch (err) {
    if (!(err instanceof ApiError) || (err.status !== 404 && err.status !== 501)) {
      // try per-task if project list missing
    }
  }

  // Attempt first task endpoint to detect BE support
  if (taskIds[0]) {
    try {
      const res = await apiClient.get<TaskProgressSnapshot[] | { items: TaskProgressSnapshot[] }>(
        PROGRESS_SNAPSHOT_ENDPOINTS.list(projectId, taskIds[0]),
        { skipErrorToast: true }
      )
      const first = Array.isArray(res) ? res : res.items ?? []
      const rest = await Promise.all(
        taskIds.slice(1).map(async (id) => {
          try {
            const r = await apiClient.get<
              TaskProgressSnapshot[] | { items: TaskProgressSnapshot[] }
            >(PROGRESS_SNAPSHOT_ENDPOINTS.list(projectId, id), { skipErrorToast: true })
            return Array.isArray(r) ? r : r.items ?? []
          } catch {
            return []
          }
        })
      )
      return { items: [...first, ...rest.flat()], source: 'api' }
    } catch {
      // fall through to local
    }
  }

  return { items: listLocalProgressSnapshots(projectId), source: 'local' }
}

export async function createProgressSnapshot(
  projectId: string,
  taskId: string,
  body: CreateProgressSnapshotPayload
): Promise<{ snapshot: TaskProgressSnapshot; source: 'api' | 'local' }> {
  try {
    const snapshot = await apiClient.post<TaskProgressSnapshot>(
      PROGRESS_SNAPSHOT_ENDPOINTS.create(projectId, taskId),
      body,
      { skipErrorToast: true }
    )
    return { snapshot, source: 'api' }
  } catch (err) {
    if (err instanceof ApiError && err.status !== 404 && err.status !== 501) {
      throw err
    }
  }
  return {
    snapshot: createLocalProgressSnapshot(projectId, taskId, body),
    source: 'local',
  }
}
