export interface OrgInvite {
  id: string
  org_id: string
  email: string
  role: 'member' | 'partner'
  status: string
  expires_at: string
  created_at: string
}

export interface OrgInviteCreateResponse extends OrgInvite {
  invite_link?: string
  invite_token?: string
}

export interface OrgInvitesResponse {
  items: OrgInvite[]
  page: { limit: number; offset: number; total: number }
}

export type OrgInviteRole = 'member' | 'partner'

export interface CreateInviteModalProps {
  orgId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}
