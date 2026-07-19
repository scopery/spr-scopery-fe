import type { UtilizationBand } from '../enums/capacity.enum'

export interface CapacityPeriodBucket {
  period: string
  availableHours: number
  focusedHours: number
  allocatedHours: number
  surplusHours: number
  status?: UtilizationBand | string
}

export interface CapacityAttentionItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  label: string
  count?: number
}

export interface CapacityOverview {
  workspaceId: string
  fromDate: string
  toDate: string
  availableCapacityHours: number | null
  focusedCapacityHours: number | null
  allocatedHours: number | null
  remainingCapacityHours: number | null
  overAllocatedResourceCount: number | null
  utilizationPercent: number | null
  periods: CapacityPeriodBucket[]
  attention: CapacityAttentionItem[]
}

export interface OverAllocationItem {
  resourceProfileId: string | null
  resourceDisplayName: string | null
  userId: string | null
  projectId: string | null
  projectName: string | null
  allocatedPercent: number | null
  allocatedHours: number | null
  availableHours: number | null
  utilizationPercent: number | null
  fromDate: string | null
  toDate: string | null
}

export interface CapacityDailyEntry {
  date: string
  workingHours: number
  focusedHours: number
  allocatedHours: number
}

export interface CapacityCalculation {
  workspaceId: string
  userId: string | null
  projectId: string | null
  fromDate: string
  toDate: string
  dailyEntries: CapacityDailyEntry[]
  totalWorkingHours: number
  totalFocusedHours: number
  totalProjectAllocatedHours: number
}

export interface CalculateCapacityPayload {
  userId?: string
  projectId?: string
  fromDate: string
  toDate: string
}

export interface UserAvailability {
  userId: string
  workspaceId: string
  fromDate: string
  toDate: string
  totalWorkingHours: number
  totalFocusedHours: number
  totalAllocatedHours: number
  remainingHours: number
  dailyEntries: CapacityDailyEntry[]
}
