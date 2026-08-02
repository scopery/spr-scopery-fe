export interface TaskProgressSnapshot {
  taskId: string
  snapshotDate: string
  progressPercent: number
  timeSpentMinutes: number | null
  note: string | null
  recordedAt: string
  recordedBy?: string | null
}

export interface CreateProgressSnapshotPayload {
  progressPercent: number
  snapshotDate?: string
  timeSpentMinutes?: number | null
  note?: string | null
}
