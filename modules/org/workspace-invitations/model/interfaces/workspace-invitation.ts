export type WorkspaceInvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

export interface WorkspaceInvitation {
  id: string
  workspaceId: string
  invitedEmail: string | null
  invitationCode: string | null
  invitationCodeHint: string | null
  status: WorkspaceInvitationStatus
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  createdAt: string
}

export interface CreateWorkspaceInvitationPayload {
  invitedEmail?: string
  maxUses?: number
  expiresAt?: string
  sendEmail?: boolean
}

export interface CreateWorkspaceInvitationModalProps {
  workspaceId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}
