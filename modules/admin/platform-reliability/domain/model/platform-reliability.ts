export interface PlatformAuditEvent {
  id: string
  eventType: string
  severity: string | null
  actorId: string | null
  actorType: string | null
  resourceType: string | null
  resourceRefId: string | null
  organizationId: string | null
  workspaceId: string | null
  beforeState: string | null
  afterState: string | null
  reason: string | null
  traceId: string | null
  occurredAt: string
}

export interface SearchPlatformAuditEventsParams {
  eventType?: string
  severity?: string
  actorId?: string
  resourceType?: string
  organizationId?: string
  workspaceId?: string
  page?: number
  size?: number
}

export interface PlatformPageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type PlatformHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN'

export interface PlatformOverviewMetric {
  id: string
  label: string
  value: number | null
  href: string
  tone: 'neutral' | 'success' | 'warning' | 'error'
  available: boolean
  note?: string
}
