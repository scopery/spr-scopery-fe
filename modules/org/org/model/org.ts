export interface OrgListItem {
  id: string
  name: string
  status: string
  my_role: 'owner' | 'member' | 'partner'
  my_status: string
  created_at: string
}

export interface OrgListResponse {
  items: OrgListItem[]
  page: { limit: number; offset: number; total: number }
}

export interface OrgDetail {
  id: string
  name: string
  status: string
  my_role: 'owner' | 'member' | 'partner'
  my_status: string
  created_at: string
}

export interface OrgMember {
  user_id: string
  display_name: string
  email: string
  role: 'owner' | 'member' | 'partner'
  status: string
}

export interface OrgMembersResponse {
  items: OrgMember[]
  page: { limit: number; offset: number; total: number }
}

export type OrgMemberRole = 'owner' | 'member' | 'partner'
