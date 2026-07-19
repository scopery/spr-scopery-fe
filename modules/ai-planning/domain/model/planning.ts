export interface AiPlanningRun {
  id: string
  projectId: string
  title?: string
  status: string
  createdAt: string
  completedAt?: string | null
}

export interface AiPlanningSuggestion {
  id: string
  runId: string
  title: string
  state: string
  summary?: string | null
  requiresChangeRequest?: boolean
}
