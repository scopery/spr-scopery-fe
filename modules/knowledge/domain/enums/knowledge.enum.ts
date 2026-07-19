export const DocumentTypeStatus = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
  Archived: 'ARCHIVED',
} as const
export type DocumentTypeStatus = (typeof DocumentTypeStatus)[keyof typeof DocumentTypeStatus]
