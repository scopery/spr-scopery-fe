export const SupportStatus = {
  Yes: 'YES',
  No: 'NO',
  Conditional: 'CONDITIONAL',
} as const
export type SupportStatus = (typeof SupportStatus)[keyof typeof SupportStatus]

export const ParameterValueType = {
  Number: 'NUMBER',
  Integer: 'INTEGER',
  String: 'STRING',
  Boolean: 'BOOLEAN',
} as const
export type ParameterValueType =
  (typeof ParameterValueType)[keyof typeof ParameterValueType]

export const IfNullBehavior = {
  DoNotSend: 'DO_NOT_SEND_PARAMETER',
  UseProviderDefault: 'USE_PROVIDER_DEFAULT',
} as const
export type IfNullBehavior = (typeof IfNullBehavior)[keyof typeof IfNullBehavior]

export const CapabilityStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const
export type CapabilityStatus =
  (typeof CapabilityStatus)[keyof typeof CapabilityStatus]

export const SUPPORT_STATUS_OPTIONS = [
  { value: SupportStatus.Yes, label: 'Yes' },
  { value: SupportStatus.No, label: 'No' },
  { value: SupportStatus.Conditional, label: 'Conditional' },
]

export const VALUE_TYPE_OPTIONS = [
  { value: ParameterValueType.Number, label: 'Number' },
  { value: ParameterValueType.Integer, label: 'Integer' },
  { value: ParameterValueType.String, label: 'String' },
  { value: ParameterValueType.Boolean, label: 'Boolean' },
]

export const IF_NULL_BEHAVIOR_OPTIONS = [
  { value: IfNullBehavior.DoNotSend, label: 'Do not send parameter' },
  { value: IfNullBehavior.UseProviderDefault, label: 'Use provider default' },
]
