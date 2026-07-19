export const UsagePolicyTargetType = {
  Global: 'GLOBAL',
  EventConfig: 'EVENT_CONFIG',
  Agent: 'AGENT',
  ModelDeployment: 'MODEL_DEPLOYMENT',
} as const
export type UsagePolicyTargetType =
  (typeof UsagePolicyTargetType)[keyof typeof UsagePolicyTargetType]

export const UsagePolicyPeriod = {
  Minute: 'MINUTE',
  Hour: 'HOUR',
  Day: 'DAY',
  Week: 'WEEK',
  Month: 'MONTH',
} as const
export type UsagePolicyPeriod =
  (typeof UsagePolicyPeriod)[keyof typeof UsagePolicyPeriod]

export const UsagePolicyAction = {
  Reject: 'REJECT',
  Throttle: 'THROTTLE',
  Warn: 'WARN',
} as const
export type UsagePolicyAction =
  (typeof UsagePolicyAction)[keyof typeof UsagePolicyAction]

export const UsagePolicyStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type UsagePolicyStatus =
  (typeof UsagePolicyStatus)[keyof typeof UsagePolicyStatus]

export const USAGE_TARGET_TYPE_OPTIONS = [
  { value: UsagePolicyTargetType.Global, label: 'Global' },
  { value: UsagePolicyTargetType.EventConfig, label: 'Event config' },
  { value: UsagePolicyTargetType.Agent, label: 'Agent' },
  { value: UsagePolicyTargetType.ModelDeployment, label: 'Model deployment' },
]

export const USAGE_PERIOD_OPTIONS = [
  { value: UsagePolicyPeriod.Minute, label: 'Minute' },
  { value: UsagePolicyPeriod.Hour, label: 'Hour' },
  { value: UsagePolicyPeriod.Day, label: 'Day' },
  { value: UsagePolicyPeriod.Week, label: 'Week' },
  { value: UsagePolicyPeriod.Month, label: 'Month' },
]

export const USAGE_ACTION_OPTIONS = [
  { value: UsagePolicyAction.Reject, label: 'Reject' },
  { value: UsagePolicyAction.Throttle, label: 'Throttle' },
  { value: UsagePolicyAction.Warn, label: 'Warn' },
]
