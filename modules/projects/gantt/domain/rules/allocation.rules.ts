import { AllocationSource, DEFAULT_DAY_CAPACITY_MINUTES } from '../enums/timeline.enum'
import type { TaskAllocationPlan } from '../model/allocation'
import { autoDailyAllocationMinutes } from './timeline-buckets.rules'
import { eachWorkingDay } from './working-calendar.rules'

export function resolveDailyAllocationMinutes(
  startDate: string | null,
  endDate: string | null,
  estimateHours: number | null,
  manual: TaskAllocationPlan | null | undefined
): Map<string, number> {
  if (manual && Object.keys(manual.days).length > 0) {
    const map = new Map<string, number>()
    for (const [day, minutes] of Object.entries(manual.days)) {
      if (minutes > 0) map.set(day, minutes)
    }
    return map
  }
  return autoDailyAllocationMinutes(startDate, endDate, estimateHours)
}

export function allocationTotals(plan: TaskAllocationPlan | null | undefined): {
  allocatedMinutes: number
  dayCount: number
} {
  if (!plan) return { allocatedMinutes: 0, dayCount: 0 }
  const values = Object.values(plan.days)
  return {
    allocatedMinutes: values.reduce((s, m) => s + m, 0),
    dayCount: values.filter((m) => m > 0).length,
  }
}

export function allocationBalance(
  plan: TaskAllocationPlan | null | undefined,
  estimateHours: number | null
): { estimateMinutes: number | null; allocatedMinutes: number; deltaMinutes: number | null } {
  const { allocatedMinutes } = allocationTotals(plan)
  if (estimateHours == null || estimateHours <= 0) {
    return { estimateMinutes: null, allocatedMinutes, deltaMinutes: null }
  }
  const estimateMinutes = Math.round(estimateHours * 60)
  return {
    estimateMinutes,
    allocatedMinutes,
    deltaMinutes: estimateMinutes - allocatedMinutes,
  }
}

/** Seed a manual plan from auto split (ready to edit). */
export function seedManualFromAuto(
  taskId: string,
  startDate: string,
  endDate: string,
  estimateHours: number | null
): TaskAllocationPlan {
  const auto = autoDailyAllocationMinutes(startDate, endDate, estimateHours)
  const days: Record<string, number> = {}
  for (const [d, m] of auto) days[d] = m
  return { taskId, days }
}

export function setDayMinutes(
  plan: TaskAllocationPlan,
  workDate: string,
  plannedMinutes: number
): TaskAllocationPlan {
  const days = { ...plan.days }
  if (plannedMinutes <= 0) delete days[workDate]
  else days[workDate] = Math.round(plannedMinutes)
  return { taskId: plan.taskId, days }
}

export function occupancyPercent(
  plannedMinutes: number,
  capacityMinutes: number = DEFAULT_DAY_CAPACITY_MINUTES
): number | null {
  if (capacityMinutes <= 0) return null
  return Math.round((plannedMinutes / capacityMinutes) * 1000) / 10
}

export function redistributeEvenly(
  taskId: string,
  startDate: string,
  endDate: string,
  estimateHours: number
): TaskAllocationPlan {
  return seedManualFromAuto(taskId, startDate, endDate, estimateHours)
}

export function workingDaysInRange(startDate: string, endDate: string): string[] {
  return eachWorkingDay(startDate, endDate)
}

export { AllocationSource }
