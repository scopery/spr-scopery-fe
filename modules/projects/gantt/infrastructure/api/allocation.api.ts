import { apiClient } from '@/shared/lib/apiClient'
import { ApiError } from '@/shared/lib/api-types'
import { apiPath } from '@/shared/lib/api-paths'
import type { TaskAllocationPlan } from '../../domain/model/allocation'
import { AllocationSource } from '../../domain/enums/timeline.enum'
import {
  clearLocalAllocation,
  listLocalAllocations,
  saveLocalAllocation,
} from './allocation.local'
import { replaceDailyAllocations } from './timeline.api'

export const ALLOCATION_ENDPOINTS = {
  listProject: (projectId: string) =>
    apiPath(`/projects/${projectId}/daily-allocations`),
} as const

interface AllocationItemDto {
  taskId: string
  workDate: string
  plannedMinutes: number
  source: string
}

/**
 * Prefer BE when available; fall back to localStorage interim store on 404/501.
 */
export async function listAllocationsForProject(
  projectId: string
): Promise<{ byTaskId: Record<string, TaskAllocationPlan>; source: 'api' | 'local' }> {
  try {
    const res = await apiClient.get<{ items: AllocationItemDto[] }>(
      ALLOCATION_ENDPOINTS.listProject(projectId),
      { skipErrorToast: true }
    )
    const byTaskId: Record<string, TaskAllocationPlan> = {}
    for (const row of res.items ?? []) {
      if (row.source !== AllocationSource.Manual && row.source !== 'MANUAL') continue
      const plan = byTaskId[row.taskId] ?? { taskId: row.taskId, days: {} }
      if (row.plannedMinutes > 0) {
        plan.days[row.workDate] = row.plannedMinutes
      }
      byTaskId[row.taskId] = plan
    }
    return { byTaskId, source: 'api' }
  } catch (err) {
    if (err instanceof ApiError && err.status !== 404 && err.status !== 501) {
      // still fall back for missing route
    }
  }
  return { byTaskId: listLocalAllocations(projectId), source: 'local' }
}

export async function saveAllocationPlan(
  projectId: string,
  plan: TaskAllocationPlan
): Promise<{ source: 'api' | 'local' }> {
  const items = Object.entries(plan.days).map(([workDate, plannedMinutes]) => ({
    workDate,
    plannedMinutes,
  }))
  try {
    await replaceDailyAllocations(projectId, plan.taskId, items)
    return { source: 'api' }
  } catch (err) {
    if (err instanceof ApiError && err.status !== 404 && err.status !== 501) {
      throw err
    }
  }
  saveLocalAllocation(projectId, plan)
  return { source: 'local' }
}

export async function clearAllocationPlan(
  projectId: string,
  taskId: string
): Promise<{ source: 'api' | 'local' }> {
  try {
    await replaceDailyAllocations(projectId, taskId, [])
    return { source: 'api' }
  } catch (err) {
    if (err instanceof ApiError && err.status !== 404 && err.status !== 501) {
      throw err
    }
  }
  clearLocalAllocation(projectId, taskId)
  return { source: 'local' }
}
