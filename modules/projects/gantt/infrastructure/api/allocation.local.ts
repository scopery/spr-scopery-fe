import type { TaskAllocationPlan } from '../../domain/model/allocation'

const storageKey = (projectId: string) =>
  `scopery.timeline.allocations.v1.${projectId}`

function readAll(projectId: string): Record<string, TaskAllocationPlan> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(storageKey(projectId))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, TaskAllocationPlan>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(projectId: string, data: Record<string, TaskAllocationPlan>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(data))
}

export function listLocalAllocations(
  projectId: string
): Record<string, TaskAllocationPlan> {
  return readAll(projectId)
}

export function saveLocalAllocation(
  projectId: string,
  plan: TaskAllocationPlan
): void {
  const all = readAll(projectId)
  all[plan.taskId] = plan
  writeAll(projectId, all)
}

export function clearLocalAllocation(projectId: string, taskId: string): void {
  const all = readAll(projectId)
  delete all[taskId]
  writeAll(projectId, all)
}

const baselineKey = (projectId: string) =>
  `scopery.timeline.baseline.v1.${projectId}`

export type TimelineBaseline = Record<
  string,
  { startDate: string | null; endDate: string | null; capturedAt: string }
>

export function loadLocalBaseline(projectId: string): TimelineBaseline {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(baselineKey(projectId))
    return raw ? (JSON.parse(raw) as TimelineBaseline) : {}
  } catch {
    return {}
  }
}

export function saveLocalBaseline(projectId: string, baseline: TimelineBaseline): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(baselineKey(projectId), JSON.stringify(baseline))
}
