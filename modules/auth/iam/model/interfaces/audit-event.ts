export interface IamAuditEvent {
  id: string
  eventType: string
  severity: string
  actorId: string | null
  actorType: string | null
  resourceType: string | null
  resourceRefId: string | null
  organizationId: string | null
  workspaceId: string | null
  beforeState: string | null
  afterState: string | null
  reason: string | null
  traceId: string
  occurredAt: string
}

export interface SearchAuditEventsParams {
  eventType?: string
  severity?: string
  actorId?: string
  resourceType?: string
  organizationId?: string
  workspaceId?: string
  page?: number
  size?: number
}
