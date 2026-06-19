import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import type {
  AIBudgetListItem,
  AIBudgetOverview,
  CreateAIBudgetPayload,
  UpdateAIBudgetPayload,
} from '../model/ai-budget'

function assertEnabled(): void {
  if (!FEATURES.aiAdminAgents) {
    throw new Error('AI Agent Control is currently disabled.')
  }
}

export async function getBudgetOverview(orgId: string): Promise<AIBudgetOverview> {
  assertEnabled()
  return apiClient.get<AIBudgetOverview>(`/api/v2/orgs/${orgId}/ai-budgets/overview`)
}

export async function listBudgets(
  orgId: string,
  params?: { active?: boolean }
): Promise<{ items: AIBudgetListItem[] }> {
  assertEnabled()
  const query = params?.active !== undefined ? `?active=${params.active}` : ''
  return apiClient.get<{ items: AIBudgetListItem[] }>(`/api/v2/orgs/${orgId}/ai-budgets${query}`)
}

export async function createBudget(
  orgId: string,
  payload: CreateAIBudgetPayload
): Promise<AIBudgetListItem> {
  assertEnabled()
  return apiClient.post<AIBudgetListItem>(`/api/v2/orgs/${orgId}/ai-budgets`, payload)
}

export async function updateBudget(
  orgId: string,
  budgetId: string,
  payload: UpdateAIBudgetPayload
): Promise<AIBudgetListItem> {
  assertEnabled()
  return apiClient.patch<AIBudgetListItem>(`/api/v2/orgs/${orgId}/ai-budgets/${budgetId}`, payload)
}

export async function deactivateBudget(orgId: string, budgetId: string): Promise<AIBudgetListItem> {
  assertEnabled()
  return apiClient.post<AIBudgetListItem>(
    `/api/v2/orgs/${orgId}/ai-budgets/${budgetId}/deactivate`,
    {}
  )
}

export type { AIBudgetListItem, AIBudgetOverview } from '../model/ai-budget'
