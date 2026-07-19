import { FEATURES } from '@/config/features'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList } from '@/shared/lib/normalizeListResponse'
import { AI_BUDGETS_ENDPOINTS } from './endpoints'
import type {
  AIBudgetListItem,
  AIBudgetOverview,
  CreateAIBudgetPayload,
  UpdateAIBudgetPayload,
} from '../../domain/model/ai-budget'

function assertEnabled(): void {
  if (!FEATURES.aiAdminAgents) {
    throw new Error('AI Agent Control is currently disabled.')
  }
}

export async function getBudgetOverview(orgId: string): Promise<AIBudgetOverview> {
  assertEnabled()
  return apiClient.get<AIBudgetOverview>(AI_BUDGETS_ENDPOINTS.overview(orgId))
}

export async function listBudgets(
  orgId: string,
  params?: { active?: boolean }
): Promise<{ items: AIBudgetListItem[] }> {
  assertEnabled()
  const res = await apiClient.get<AIBudgetListItem[]>(AI_BUDGETS_ENDPOINTS.list(orgId, params))
  return normalizeItemList(res)
}

export async function createBudget(
  orgId: string,
  payload: CreateAIBudgetPayload
): Promise<AIBudgetListItem> {
  assertEnabled()
  return apiClient.post<AIBudgetListItem>(AI_BUDGETS_ENDPOINTS.create(orgId), payload)
}

export async function updateBudget(
  orgId: string,
  budgetId: string,
  payload: UpdateAIBudgetPayload
): Promise<AIBudgetListItem> {
  assertEnabled()
  return apiClient.patch<AIBudgetListItem>(AI_BUDGETS_ENDPOINTS.detail(orgId, budgetId), payload)
}

export async function deactivateBudget(orgId: string, budgetId: string): Promise<AIBudgetListItem> {
  assertEnabled()
  return apiClient.post<AIBudgetListItem>(AI_BUDGETS_ENDPOINTS.deactivate(orgId, budgetId), {})
}
