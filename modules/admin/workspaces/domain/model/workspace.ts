import type { WorkspaceStatus, WorkspaceVisibility, WorkspaceJoinPolicy, InvitationStatus } from '../enums/workspace.enum'

export interface Workspace {
  id: string
  organizationId: string
  name: string
  code: string
  description: string | null
  defaultVisibility: WorkspaceVisibility
  joinPolicy: WorkspaceJoinPolicy
  ownerUserId: string | null
  status: WorkspaceStatus
  ownerMembershipCreated?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateWorkspacePayload {
  organizationId: string
  name: string
  code: string
  description?: string
  defaultVisibility?: WorkspaceVisibility
  joinPolicy?: WorkspaceJoinPolicy
}

export interface UpdateWorkspacePayload {
  name: string
  description?: string
  defaultVisibility?: WorkspaceVisibility
  joinPolicy?: WorkspaceJoinPolicy
}

export interface SearchWorkspacesParams {
  organizationId?: string
  ownerUserId?: string
  keyword?: string
  status?: WorkspaceStatus
  page?: number
  size?: number
}

export interface WorkspaceMember {
  id: string
  workspaceId: string
  userId: string
  status: 'ACTIVE' | 'INACTIVE'
  joinedAt: string
  createdAt?: string
  updatedAt?: string
}

export interface WorkspaceTeam {
  id: string
  workspaceId: string
  name: string
  code: string
  description: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  createdAt: string
  updatedAt: string
}

export interface WorkspaceTeamMember {
  id: string
  teamId: string
  userId: string
  joinedAt: string
}

export interface CreateTeamPayload {
  name: string
  code: string
  description?: string
}

export interface UpdateTeamPayload {
  name: string
  description?: string
}

export interface WorkspaceInvitation {
  id: string
  workspaceId: string
  invitedEmail: string | null
  invitationCode: string | null
  invitationCodeHint: string | null
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  status: InvitationStatus
  createdAt: string
}

export interface CreateInvitationPayload {
  invitedEmail?: string
  maxUses?: number
  expiresAt?: string
  sendEmail?: boolean
}
