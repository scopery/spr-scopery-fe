export interface ResourceRole {
  id: string
  workspaceId: string
  roleCode: string
  name: string
  status?: string | null
  description?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateResourceRolePayload {
  roleCode: string
  name: string
  description?: string
  defaultRateCardId?: string | null
}

export interface ResourceSkill {
  id: string
  workspaceId: string
  skillCode: string
  name: string
  status?: string | null
  description?: string | null
  createdAt: string
  updatedAt?: string
}

export interface CreateResourceSkillPayload {
  skillCode: string
  name: string
  description?: string
  defaultRateCardId?: string | null
}
