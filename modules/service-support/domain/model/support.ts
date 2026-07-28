export interface SupportCase {
  id: string
  workspaceId: string
  title: string
  status: string
  priority?: string
  queue?: string | null
  projectId?: string | null
  caseNumber?: string | null
  requestTypeCode?: string | null
  source?: string | null
  portalVisible?: boolean
}

export interface SupportDashboardSummary {
  openCases: number
  breachedSla: number
  openIncidents: number
}

export interface CreateSupportCasePayload {
  title: string
  requestTypeCode?: string
  priority?: string
  projectId?: string | null
  source?: string
  portalVisible?: boolean
}
