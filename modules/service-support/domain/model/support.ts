export interface SupportCase {
  id: string
  workspaceId: string
  title: string
  status: string
  priority?: string
  queue?: string | null
}

export interface SupportDashboardSummary {
  openCases: number
  breachedSla: number
  openIncidents: number
}
