import { CapacityEntityStatus, ResourceProfileStatus } from '../enums/capacity.enum'
import type { DayRuleInput } from '../model/calendar-day-rule'
import type { ProjectResourceAllocation } from '../model/project-allocation'
import type { ResourceProfile } from '../model/resource-profile'
import type { UpdateUtilizationThresholdPolicyPayload } from '../model/utilization-threshold-policy'
import type { WorkingCalendar } from '../model/working-calendar'
import type { UserCapacityProfile } from '../model/user-capacity-profile'

export function isCalendarActive(calendar: WorkingCalendar): boolean {
  return calendar.status === CapacityEntityStatus.Active
}

export function isCalendarArchived(calendar: WorkingCalendar): boolean {
  return calendar.status === CapacityEntityStatus.Archived
}

export function canEditCalendar(calendar: WorkingCalendar): boolean {
  return !isCalendarArchived(calendar)
}

export function isUserProfileActive(profile: UserCapacityProfile): boolean {
  return profile.status === CapacityEntityStatus.Active
}

export function isUserProfileArchived(profile: UserCapacityProfile): boolean {
  return profile.status === CapacityEntityStatus.Archived
}

export function isResourceArchived(resource: ResourceProfile): boolean {
  return resource.status === ResourceProfileStatus.Archived
}

export function canArchiveResource(resource: ResourceProfile): boolean {
  return !isResourceArchived(resource)
}

export function isAllocationActive(allocation: ProjectResourceAllocation): boolean {
  return allocation.status === CapacityEntityStatus.Active
}

export function isAllocationArchived(allocation: ProjectResourceAllocation): boolean {
  return allocation.status === CapacityEntityStatus.Archived
}

export function canEditAllocation(allocation: ProjectResourceAllocation): boolean {
  return !isAllocationArchived(allocation)
}

export function isAllocationRangeValid(startDate: string, endDate: string): boolean {
  return Boolean(startDate) && Boolean(endDate) && endDate >= startDate
}

export function isAllocationPercentValid(percent: number): boolean {
  return percent > 0 && percent <= 200
}

/** Sum of active allocation percents for a member overlapping a date range. */
export function sumOverlappingAllocationPercent(
  allocations: ProjectResourceAllocation[],
  workspaceMemberId: string,
  startDate: string,
  endDate: string,
  excludeId?: string
): number {
  return allocations
    .filter(
      (a) =>
        a.workspaceMemberId === workspaceMemberId &&
        a.status === CapacityEntityStatus.Active &&
        a.id !== excludeId &&
        a.startDate <= endDate &&
        a.endDate >= startDate
    )
    .reduce((sum, a) => sum + a.allocationPercent, 0)
}

/** Validate end > start for working days (HH:mm strings). */
export function isDayRuleTimeValid(rule: DayRuleInput): boolean {
  if (!rule.isWorkingDay) return true
  if (!rule.startTime || !rule.endTime) return false
  return rule.endTime > rule.startTime
}

export function areDayRulesValid(rules: DayRuleInput[]): boolean {
  return rules.every(isDayRuleTimeValid)
}

/**
 * under <= healthyMin <= healthyMax <= watchMax <= overloaded <= critical
 */
export function isThresholdOrderValid(
  policy: UpdateUtilizationThresholdPolicyPayload
): boolean {
  const values = [
    policy.underAllocatedPercent,
    policy.healthyMinPercent,
    policy.healthyMaxPercent,
    policy.watchMaxPercent,
    policy.overloadedPercent,
    policy.criticalOverloadPercent,
  ]
  for (let i = 1; i < values.length; i++) {
    if (values[i]! < values[i - 1]!) return false
  }
  return true
}

export function doEffectiveRangesOverlap(
  aFrom: string,
  aTo: string | null | undefined,
  bFrom: string,
  bTo: string | null | undefined
): boolean {
  const aEnd = aTo ?? '9999-12-31'
  const bEnd = bTo ?? '9999-12-31'
  return aFrom <= bEnd && bFrom <= aEnd
}

export function formatHours(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Math.round(value * 10) / 10}h`
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return `${Math.round(value * 10) / 10}%`
}

/** Position a bar within a timeline window (0–100%). */
export function allocationBarStyle(
  startDate: string,
  endDate: string,
  windowStart: string,
  windowEnd: string
): { left: string; width: string } | null {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const wStart = new Date(windowStart).getTime()
  const wEnd = new Date(windowEnd).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || Number.isNaN(wStart) || Number.isNaN(wEnd)) {
    return null
  }
  if (end < wStart || start > wEnd) return null
  const span = Math.max(wEnd - wStart, 1)
  const leftMs = Math.max(start, wStart) - wStart
  const rightMs = Math.min(end, wEnd) - wStart
  const left = (leftMs / span) * 100
  const width = Math.max(((rightMs - leftMs) / span) * 100, 1.5)
  return { left: `${left}%`, width: `${width}%` }
}
