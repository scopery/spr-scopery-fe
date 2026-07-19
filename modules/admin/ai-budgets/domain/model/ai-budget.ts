export type AIBudgetStatusLabel = 'ok' | 'warning' | 'exceeded' | 'inactive'

export interface AIBudgetScope {
  orgId: string | null
  projectId: string | null
  userId: string | null
  agentId: string | null
  agentKey: string | null
  agentName: string | null
  projectName: string | null
  label: string
}

export interface AIBudgetListItem {
  budgetId: string
  scope: AIBudgetScope
  monthlyLimitAmount: number | null
  monthlyLimitTokens: number | null
  warningThresholdPercent: number
  hardLimitEnabled: boolean
  active: boolean
  currentMonthCost: number | null
  currentMonthTokens: number
  costUsagePercent: number | null
  tokenUsagePercent: number | null
  statusLabel: AIBudgetStatusLabel
}

export interface AIBudgetOverview {
  activeBudgets: number
  budgetsInWarning: number
  budgetsExceeded: number
  totalMonthlyLimitAmount: number | null
  totalCurrentEstimatedCost: number | null
  totalMonthlyLimitTokens: number | null
  totalCurrentTokens: number
  currency: string
}

export interface CreateAIBudgetPayload {
  project_id?: string | null
  user_id?: string | null
  agent_id?: string | null
  monthly_limit_amount?: number | null
  monthly_limit_tokens?: number | null
  warning_threshold_percent?: number
  hard_limit_enabled?: boolean
  active?: boolean
}

export type UpdateAIBudgetPayload = Partial<CreateAIBudgetPayload>
