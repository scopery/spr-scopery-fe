import type { OrgTeamAssignmentStatus, OrgTeamStatus } from './enums/org-team.enum'

export interface OrgTeam {
  id: string
  organizationId: string
  code: string
  name: string
  description: string | null
  status: OrgTeamStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface OrgTeamMember {
  teamId: string
  userId: string
  joinedAt: string
}

export interface OrgTeamWorkspaceAssignment {
  id: string
  teamId: string
  workspaceId: string
  assignedBy: string
  assignedAt: string
  status: OrgTeamAssignmentStatus | string
}

export interface CreateOrgTeamPayload {
  name: string
  code: string
  description?: string
}

export interface UpdateOrgTeamPayload {
  name: string
  description?: string
}

export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
