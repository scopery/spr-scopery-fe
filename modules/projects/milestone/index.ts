export { MilestonesView } from './presentation/ui/MilestonesView'
export { useProjectMilestones } from './presentation/hooks/useProjectMilestones'
export * as milestonesApi from './infrastructure/api/milestones.api'
export type { Milestone, CreateMilestonePayload } from './domain/model/milestone'
export { MilestoneStatus } from './domain/enums/milestone.enum'
export {
  canAchieveMilestone,
  isOverdueMilestone,
  milestoneStatusLabel,
  milestoneStatusTone,
} from './domain/rules/milestone.rules'
