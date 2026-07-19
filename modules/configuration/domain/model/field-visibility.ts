export interface FieldVisibilityPolicy {
  id: string
  workspaceId: string
  customFieldDefinitionId: string
  audienceType: string
  visible: boolean
  createdAt: string
  updatedAt: string
}

export interface SetFieldVisibilityPayload {
  audienceType: string
  visible: boolean
}
