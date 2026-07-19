export const DocumentScope = {
  System: 'SYSTEM',
  Workspace: 'WORKSPACE',
} as const
export type DocumentScope = (typeof DocumentScope)[keyof typeof DocumentScope]

export const DocumentTypeStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const
export type DocumentTypeStatus = (typeof DocumentTypeStatus)[keyof typeof DocumentTypeStatus]
