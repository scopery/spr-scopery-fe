export const EventConfigEnvironment = {
  Dev: 'DEV',
  Uat: 'UAT',
  Prod: 'PROD',
} as const
export type EventConfigEnvironment =
  (typeof EventConfigEnvironment)[keyof typeof EventConfigEnvironment]

export const EventTriggerType = {
  Event: 'EVENT',
  Manual: 'MANUAL',
  Scheduled: 'SCHEDULED',
  Api: 'API',
} as const
export type EventTriggerType =
  (typeof EventTriggerType)[keyof typeof EventTriggerType]

export const EventConfigStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type EventConfigStatus =
  (typeof EventConfigStatus)[keyof typeof EventConfigStatus]

export const EVENT_ENVIRONMENT_OPTIONS = [
  { value: EventConfigEnvironment.Dev, label: 'DEV' },
  { value: EventConfigEnvironment.Uat, label: 'UAT' },
  { value: EventConfigEnvironment.Prod, label: 'PROD' },
]

export const EVENT_TRIGGER_TYPE_OPTIONS = [
  { value: EventTriggerType.Event, label: 'Event' },
  { value: EventTriggerType.Manual, label: 'Manual' },
  { value: EventTriggerType.Scheduled, label: 'Scheduled' },
  { value: EventTriggerType.Api, label: 'API' },
]
