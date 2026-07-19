export const ToolMutationType = {
  ReadOnly: 'READ_ONLY',
  Write: 'WRITE',
  ReadWrite: 'READ_WRITE',
} as const
export type ToolMutationType = (typeof ToolMutationType)[keyof typeof ToolMutationType]

export const ToolStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Deprecated: 'DEPRECATED',
} as const
export type ToolStatus = (typeof ToolStatus)[keyof typeof ToolStatus]

export const TOOL_MUTATION_TYPE_OPTIONS = [
  { value: ToolMutationType.ReadOnly, label: 'Read only' },
  { value: ToolMutationType.Write, label: 'Write' },
  { value: ToolMutationType.ReadWrite, label: 'Read / write' },
] as const

export const TOOL_STATUS_OPTIONS = [
  { value: ToolStatus.Active, label: 'Active' },
  { value: ToolStatus.Inactive, label: 'Inactive' },
  { value: ToolStatus.Deprecated, label: 'Deprecated' },
] as const
