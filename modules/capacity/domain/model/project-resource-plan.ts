export const ResourceRiskStatus = {
  Open: 'OPEN',
  Mitigated: 'MITIGATED',
  Closed: 'CLOSED',
} as const
export type ResourceRiskStatus =
  (typeof ResourceRiskStatus)[keyof typeof ResourceRiskStatus]

export interface ResourceRiskFlag {
  id: string
  projectId: string
  resourceProfileId: string | null
  riskReason: string
  impactType: string
  description: string | null
  status: ResourceRiskStatus | string
  mitigatedAt: string | null
  closedAt: string | null
  createdAt: string
}

export interface CreateResourceRiskFlagPayload {
  resourceProfileId: string
  riskReason: string
  impactType: string
  description?: string | null
}

export const AssignmentConflictStatus = {
  Open: 'OPEN',
  Acknowledged: 'ACKNOWLEDGED',
  Resolved: 'RESOLVED',
} as const
export type AssignmentConflictStatus =
  (typeof AssignmentConflictStatus)[keyof typeof AssignmentConflictStatus]

export interface AssignmentConflict {
  id: string
  projectId: string
  conflictType: string
  severity: string
  resourceProfileId: string | null
  taskId: string | null
  description: string | null
  status: AssignmentConflictStatus | string
  acknowledgedAt: string | null
  createdAt: string
}

export interface ProjectAllocationSummary {
  projectId: string
  fromDate: string | null
  toDate: string | null
  totalAllocatedPercent: number | null
  totalAllocatedHours: number | null
  memberCount: number | null
  items?: unknown
}
