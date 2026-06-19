'use client'

import * as orgInvitesApi from '../api/org-invites.api'

export function useOrgInviteActions() {
  return {
    acceptInvite: orgInvitesApi.acceptInvite,
    listInvites: orgInvitesApi.listInvites,
    createInvite: orgInvitesApi.createInvite,
    revokeInvite: orgInvitesApi.revokeInvite,
  }
}
