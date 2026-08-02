import type {
  CreateProgressSnapshotPayload,
  TaskProgressSnapshot,
} from '../../domain/model/progress-snapshot'
import { formatLocalDate, todayLocal } from '../../domain/rules/working-calendar.rules'

const storageKey = (projectId: string) =>
  `scopery.timeline.progressSnapshots.v1.${projectId}`

function readAll(projectId: string): TaskProgressSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(projectId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as TaskProgressSnapshot[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(projectId: string, items: TaskProgressSnapshot[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(items))
}

/** Local interim store until BE progress-snapshots API ships. */
export function listLocalProgressSnapshots(projectId: string): TaskProgressSnapshot[] {
  return readAll(projectId)
}

export function createLocalProgressSnapshot(
  projectId: string,
  taskId: string,
  body: CreateProgressSnapshotPayload
): TaskProgressSnapshot {
  const snapshot: TaskProgressSnapshot = {
    taskId,
    snapshotDate: body.snapshotDate ?? formatLocalDate(todayLocal()),
    progressPercent: body.progressPercent,
    timeSpentMinutes: body.timeSpentMinutes ?? null,
    note: body.note ?? null,
    recordedAt: new Date().toISOString(),
  }
  const next = [...readAll(projectId).filter(
    (s) => !(s.taskId === taskId && s.snapshotDate === snapshot.snapshotDate)
  ), snapshot]
  writeAll(projectId, next)
  return snapshot
}
