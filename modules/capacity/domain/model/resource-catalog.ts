export interface ResourceRole {
  id: string
  workspaceId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateResourceRolePayload {
  name: string
  description?: string
}

export interface ResourceSkill {
  id: string
  workspaceId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateResourceSkillPayload {
  name: string
  description?: string
}
