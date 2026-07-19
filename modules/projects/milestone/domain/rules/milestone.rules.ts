import { MilestoneStatus } from '../enums/milestone.enum'
import type { Milestone } from '../model/milestone'

export function canAchieveMilestone(m: Milestone): boolean {
  return m.status === MilestoneStatus.Pending
}

export function isOverdueMilestone(m: Milestone): boolean {
  if (m.status !== MilestoneStatus.Pending || !m.targetDate) return false
  return new Date(m.targetDate) < new Date()
}

export function milestoneStatusLabel(status: string): string {
  switch (status) {
    case MilestoneStatus.Pending:
      return 'Pending'
    case MilestoneStatus.Achieved:
      return 'Achieved'
    case MilestoneStatus.Missed:
      return 'Missed'
    case MilestoneStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function milestoneStatusTone(
  status: string
): 'neutral' | 'success' | 'warning' | 'error' {
  switch (status) {
    case MilestoneStatus.Achieved:
      return 'success'
    case MilestoneStatus.Missed:
      return 'error'
    default:
      return 'neutral'
  }
}
