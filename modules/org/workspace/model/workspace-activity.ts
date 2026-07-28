export interface WorkspaceActivityFeedItem {
  id: string
  occurredAt: string
  eventType: string
  severity: string
  actorId: string | null
  actorType: string | null
  resourceType: string | null
  resourceRefId: string | null
  reason: string | null
}

export interface WorkspaceActivityFeedPage {
  items: WorkspaceActivityFeedItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
