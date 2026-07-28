import type { MyOrgInvitationRecord, OrganizationInvitation } from '../model/organization-invitation'

const STORAGE_KEY = 'scopery_org_invitations'

function readAll(): MyOrgInvitationRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MyOrgInvitationRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: MyOrgInvitationRecord[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function listTrackedOrgInvitations(organizationId: string): MyOrgInvitationRecord[] {
  return readAll()
    .filter((r) => r.organizationId === organizationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function upsertTrackedOrgInvitation(invite: OrganizationInvitation): MyOrgInvitationRecord {
  const record: MyOrgInvitationRecord = {
    id: invite.id,
    organizationId: invite.organizationId,
    inviteeEmail: invite.inviteeEmail,
    membershipType: invite.membershipType,
    status: invite.status,
    tokenHint: invite.tokenHint,
    token: invite.token,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  }
  const next = readAll().filter((r) => r.id !== record.id)
  next.unshift(record)
  writeAll(next)
  return record
}

export function updateTrackedOrgInvitationStatus(invitationId: string, status: string) {
  writeAll(readAll().map((r) => (r.id === invitationId ? { ...r, status, token: null } : r)))
}

/** Mark accepted/cancelled/expired without requiring the invite id in the accept page (match raw token). */
export function markTrackedOrgInvitationAcceptedByToken(token: string) {
  writeAll(
    readAll().map((r) =>
      r.token === token ? { ...r, status: 'ACCEPTED', token: null } : r
    )
  )
}

export function clearTrackedOrgInvitationToken(invitationId: string) {
  writeAll(readAll().map((r) => (r.id === invitationId ? { ...r, token: null } : r)))
}
