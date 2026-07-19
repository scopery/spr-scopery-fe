import type { InboxItemStatus } from '../enums/productivity.enum'

export interface WorkInboxItem {
  id: string
  title: string
  body?: string | null
  status: InboxItemStatus | string
  entityType?: string | null
  entityId?: string | null
  href?: string | null
  createdAt: string
  readAt?: string | null
}

export interface WorkInboxListResponse {
  items: WorkInboxItem[]
  page: { limit: number; offset: number; total: number }
}
