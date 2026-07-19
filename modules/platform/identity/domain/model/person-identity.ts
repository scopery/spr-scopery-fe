export interface PersonIdentity {
  id: string
  fullName: string
  email?: string | null
  username?: string | null
  avatarUrl?: string | null
}

export type UserIdentityIdMode = 'never' | 'secondary' | 'mono'
