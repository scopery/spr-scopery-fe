'use client'

import { acceptInvite, listInvites, createInvite, revokeInvite } from '@/services/org-invite.service'

export function useOrgInviteActions() {
  return { acceptInvite, listInvites, createInvite, revokeInvite }
}
