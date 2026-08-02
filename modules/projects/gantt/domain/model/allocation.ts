import type { AllocationSource } from '../enums/timeline.enum'

export interface TaskDailyAllocation {
  taskId: string
  workDate: string
  plannedMinutes: number
  source: AllocationSource
}

export interface TaskAllocationPlan {
  taskId: string
  days: Record<string, number> // workDate -> plannedMinutes
}
