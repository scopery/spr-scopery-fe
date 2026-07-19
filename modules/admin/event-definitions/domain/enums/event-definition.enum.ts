export const EventDefinitionStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type EventDefinitionStatus =
  (typeof EventDefinitionStatus)[keyof typeof EventDefinitionStatus]
