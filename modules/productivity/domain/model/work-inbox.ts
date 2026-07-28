import type { InboxItemStatus } from '../enums/productivity.enum'

/** Matches BE WorkInboxItemResponse */
export interface WorkInboxItem {
  id: string
  sourceType: string
  sourceId: string
  actionType: string
  title: string
  priority?: string | null
  dueAt?: string | null
  status: InboxItemStatus | string
  /** FE-enriched helpers */
  body?: string | null
  href?: string | null
  createdAt?: string
  readAt?: string | null
}

export interface WorkInboxListResponse {
  items: WorkInboxItem[]
  page: { limit: number; offset: number; total: number }
}

export interface MyOrgInvitation {
  id: string
  organizationId: string
  organizationName: string
  inviteeEmail: string
  membershipType: string
  status: string
  expiresAt: string
  createdAt: string
}
