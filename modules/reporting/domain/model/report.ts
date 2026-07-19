export interface ReportDefinition {
  id: string
  code: string
  name: string
  description?: string | null
}

export interface ReportRun {
  id: string
  reportCode: string
  status: string
  createdAt: string
  completedAt?: string | null
  downloadUrl?: string | null
}

export interface ReportExportJob {
  id: string
  reportRunId?: string
  reportCode?: string
  status: string
  format?: string
  fileName?: string | null
  createdAt?: string
  completedAt?: string | null
}

export interface ProjectDashboardSummary {
  projectId: string
  metrics: Array<{ key: string; label: string; value: string | number }>
}
