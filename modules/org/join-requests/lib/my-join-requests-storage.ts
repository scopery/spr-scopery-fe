import type { JoinRequest, MyJoinRequestRecord } from '../model'
import { JoinRequestStatus } from '../model'

const STORAGE_KEY = 'scopery_my_join_requests'

function readAll(): MyJoinRequestRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MyJoinRequestRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: MyJoinRequestRecord[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function listMyJoinRequestRecords(): MyJoinRequestRecord[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function upsertMyJoinRequestRecord(
  request: JoinRequest,
  workspaceCode?: string | null
): MyJoinRequestRecord {
  const record: MyJoinRequestRecord = {
    id: request.id,
    workspaceId: request.workspaceId,
    workspaceCode: workspaceCode ?? null,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt,
  }
  const next = readAll().filter((r) => r.id !== record.id)
  next.unshift(record)
  writeAll(next)
  return record
}

export function updateMyJoinRequestStatus(
  requestId: string,
  status: (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus]
) {
  const next = readAll().map((r) => (r.id === requestId ? { ...r, status } : r))
  writeAll(next)
}

export function removeMyJoinRequestRecord(requestId: string) {
  writeAll(readAll().filter((r) => r.id !== requestId))
}
