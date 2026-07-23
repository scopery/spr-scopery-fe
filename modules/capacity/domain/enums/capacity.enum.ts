export const CapacityEntityStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type CapacityEntityStatus =
  (typeof CapacityEntityStatus)[keyof typeof CapacityEntityStatus]

export const ResourceProfileStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type ResourceProfileStatus =
  (typeof ResourceProfileStatus)[keyof typeof ResourceProfileStatus]

export const ResourceType = {
  InternalUser: 'INTERNAL_USER',
  Team: 'TEAM',
  ExternalContractor: 'EXTERNAL_CONTRACTOR',
  VendorStaff: 'VENDOR_STAFF',
  PlaceholderRole: 'PLACEHOLDER_ROLE',
  SystemResource: 'SYSTEM_RESOURCE',
} as const
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType]

export const DayOfWeek = {
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY',
  Sunday: 'SUNDAY',
} as const
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek]

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
  DayOfWeek.Sunday,
]

export const CalendarExceptionType = {
  Holiday: 'HOLIDAY',
  CustomWorking: 'CUSTOM_WORKING',
  CustomNonWorking: 'CUSTOM_NON_WORKING',
} as const
export type CalendarExceptionType =
  (typeof CalendarExceptionType)[keyof typeof CalendarExceptionType]

export const UtilizationBand = {
  Under: 'UNDER',
  Healthy: 'HEALTHY',
  Watch: 'WATCH',
  Overloaded: 'OVERLOADED',
  Critical: 'CRITICAL',
} as const
export type UtilizationBand = (typeof UtilizationBand)[keyof typeof UtilizationBand]

export const AllocationType = {
  FullTime: 'FULL_TIME',
  PartTime: 'PART_TIME',
  OnDemand: 'ON_DEMAND',
} as const
export type AllocationType = (typeof AllocationType)[keyof typeof AllocationType]

/** Task ↔ resource profile assignment kinds (BE TaskAssignmentType). */
export const TaskAssignmentType = {
  Owner: 'OWNER',
  Primary: 'PRIMARY',
  Support: 'SUPPORT',
  Reviewer: 'REVIEWER',
  Qa: 'QA',
  ApproverLabelOnly: 'APPROVER_LABEL_ONLY',
} as const
export type TaskAssignmentType =
  (typeof TaskAssignmentType)[keyof typeof TaskAssignmentType]
