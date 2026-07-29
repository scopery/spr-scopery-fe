export interface DailySummaryTask {
  id: string
  code: string
  title: string
  projectId: string
  projectName: string
  phaseName: string | null
  estimateHours: number | null
  completedAt?: string | null
  startedAt?: string | null
}

export interface MemberDailySummary {
  userId: string
  done: DailySummaryTask[]
  inProgress: DailySummaryTask[]
}

export interface WorkspaceDailySummary {
  date: string
  members: MemberDailySummary[]
}
