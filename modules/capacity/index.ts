// Domain — enums
export {
  CapacityEntityStatus,
  ResourceProfileStatus,
  ResourceType,
  DayOfWeek,
  DAY_OF_WEEK_ORDER,
  CalendarExceptionType,
  UtilizationBand,
  AllocationType,
} from './domain/enums/capacity.enum'

// Domain — models
export type { PageResponse, PageParams } from './domain/model/common'
export type {
  WorkingCalendar,
  CreateWorkingCalendarPayload,
  UpdateWorkingCalendarPayload,
  WorkingCalendarSearchParams,
} from './domain/model/working-calendar'
export type {
  CalendarDayRule,
  DayRuleInput,
  ReplaceDayRulesPayload,
} from './domain/model/calendar-day-rule'
export type {
  CalendarException,
  CreateCalendarExceptionPayload,
  UpdateCalendarExceptionPayload,
  CalendarExceptionSearchParams,
} from './domain/model/calendar-exception'
export type {
  ResourceRole,
  ResourceSkill,
  CreateResourceRolePayload,
  CreateResourceSkillPayload,
} from './domain/model/resource-catalog'
export type {
  ResourceProfile,
  CreateResourceProfilePayload,
  SyncFromMembersResult,
} from './domain/model/resource-profile'
export type {
  ProjectResourceAllocation,
  CreateProjectAllocationPayload,
  UpdateProjectAllocationPayload,
  ProjectAllocationSearchParams,
} from './domain/model/project-allocation'
export type {
  CapacityOverview,
  CapacityPeriodBucket,
  CapacityAttentionItem,
  OverAllocationItem,
  CapacityCalculation,
  CalculateCapacityPayload,
  UserAvailability,
  CapacityDailyEntry,
} from './domain/model/capacity-overview'
export type {
  TaskResourceAssignment,
  CreateTaskResourceAssignmentPayload,
} from './domain/model/task-assignment'
export type {
  EffortEstimate,
  CreateEffortEstimatePayload,
  ActualEffortRecord,
  CreateActualEffortPayload,
  WorkloadSnapshot,
  CreateWorkloadSnapshotPayload,
} from './domain/model/effort'
export { ActualEffortStatus } from './domain/model/effort'
export type {
  ResourceRiskFlag,
  CreateResourceRiskFlagPayload,
  AssignmentConflict,
  ProjectAllocationSummary,
} from './domain/model/project-resource-plan'
export {
  ResourceRiskStatus,
  AssignmentConflictStatus,
} from './domain/model/project-resource-plan'
export type {
  UserCapacityProfile,
  CreateUserCapacityProfilePayload,
  UpdateUserCapacityProfilePayload,
  UserCapacityProfileSearchParams,
} from './domain/model/user-capacity-profile'
export type {
  UtilizationThresholdPolicy,
  UpdateUtilizationThresholdPolicyPayload,
} from './domain/model/utilization-threshold-policy'

// Domain — rules
export {
  isCalendarActive,
  isCalendarArchived,
  canEditCalendar,
  isUserProfileActive,
  isUserProfileArchived,
  isResourceArchived,
  canArchiveResource,
  isAllocationActive,
  isAllocationArchived,
  canEditAllocation,
  isAllocationRangeValid,
  isAllocationPercentValid,
  sumOverlappingAllocationPercent,
  isDayRuleTimeValid,
  areDayRulesValid,
  isThresholdOrderValid,
  doEffectiveRangesOverlap,
  formatHours,
  formatPercent,
  allocationBarStyle,
} from './domain/rules/capacity.rules'

// Infrastructure — API
export * as calendarsApi from './infrastructure/api/calendars.api'
export * as dayRulesApi from './infrastructure/api/day-rules.api'
export * as exceptionsApi from './infrastructure/api/exceptions.api'
export * as resourceCatalogApi from './infrastructure/api/resource-catalog.api'
export * as resourcesApi from './infrastructure/api/resources.api'
export * as capacityCalculationApi from './infrastructure/api/capacity-calculation.api'
export * as allocationsApi from './infrastructure/api/allocations.api'
export * as taskAssignmentsApi from './infrastructure/api/task-assignments.api'
export * as effortApi from './infrastructure/api/effort.api'
export * as projectResourcesApi from './infrastructure/api/project-resources.api'
export * as userProfilesApi from './infrastructure/api/user-profiles.api'
export * as utilizationPolicyApi from './infrastructure/api/utilization-policy.api'

// Presentation — hooks
export { useWorkingCalendars } from './presentation/hooks/useWorkingCalendars'
export { useWorkingCalendarDetail } from './presentation/hooks/useWorkingCalendarDetail'
export { useResourceCatalog } from './presentation/hooks/useResourceCatalog'
export { useUserCapacityProfiles } from './presentation/hooks/useUserCapacityProfiles'
export { useUtilizationPolicy } from './presentation/hooks/useUtilizationPolicy'
export { useResourceProfiles } from './presentation/hooks/useResourceProfiles'
export { useCapacityOverview } from './presentation/hooks/useCapacityOverview'
export { useAllocationPlanner } from './presentation/hooks/useAllocationPlanner'
export { useTaskResourceAssignments } from './presentation/hooks/useTaskResourceAssignments'
export { useProjectResourcePlan } from './presentation/hooks/useProjectResourcePlan'
export { useProjectEffort } from './presentation/hooks/useProjectEffort'

// Presentation — views
export { CapacitySetupView } from './presentation/ui/CapacitySetupView'
export { WorkingCalendarsView } from './presentation/ui/WorkingCalendarsView'
export { WorkingCalendarDetailView } from './presentation/ui/WorkingCalendarDetailView'
export { ResourceRolesSkillsView } from './presentation/ui/ResourceRolesSkillsView'
export { CapacityProfilesView } from './presentation/ui/CapacityProfilesView'
export { UtilizationPolicyView } from './presentation/ui/UtilizationPolicyView'
export { CapacityOverviewView } from './presentation/ui/CapacityOverviewView'
export { ResourcesProfilesView } from './presentation/ui/ResourcesProfilesView'
export { AllocationPlannerView } from './presentation/ui/AllocationPlannerView'
export { ProjectResourcePlanView } from './presentation/ui/ProjectResourcePlanView'
export { EffortWorkloadView } from './presentation/ui/EffortWorkloadView'
export { TaskResourcesPanel } from './presentation/ui/TaskResourcesPanel'
