import type { TagStatus } from '../enums/configuration.enum'

export interface TagDefinition {
  id: string
  tagCode: string
  label: string
  color: string | null
  status: TagStatus | string
}

export interface TagAssignment {
  id: string
  tagDefinitionId: string
  objectTypeCode: string
  targetId: string
}

export interface CreateTagPayload {
  tagCode: string
  label: string
  color?: string
  allowedObjectTypesJson?: string
}

export interface CreateTagAssignmentPayload {
  tagDefinitionId: string
  objectTypeCode: string
  targetId: string
}
