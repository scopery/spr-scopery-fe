import { apiClient } from '@/shared/lib/apiClient'
import { AI_AGENT_ADMIN_ENDPOINTS } from './endpoints'

export interface PageMeta {
  totalElements: number
}

function extractTotal(payload: unknown): number {
  if (!payload || typeof payload !== 'object') return 0
  const p = payload as Record<string, unknown>
  if (typeof p.totalElements === 'number') return p.totalElements
  if (typeof p.total === 'number') return p.total
  if (p.page && typeof p.page === 'object') {
    const page = p.page as Record<string, unknown>
    if (typeof page.totalElements === 'number') return page.totalElements
    if (typeof page.total === 'number') return page.total
  }
  if (Array.isArray(p.items)) return p.items.length
  return 0
}

async function countFrom(url: string): Promise<number> {
  const res = await apiClient.get<unknown>(url)
  return extractTotal(res)
}

/** Lazy aggregate counts for ADM-01 — size=1 to avoid N+1 payload weight (GAP-09). */
export async function fetchAiControlOverviewCounts(): Promise<{
  providers: number | null
  models: number | null
  deployments: number | null
  agents: number | null
  promptTemplates: number | null
  eventConfigs: number | null
  usagePolicies: number | null
  executionLogs: number | null
  tools: number | null
  errors: Partial<Record<string, string>>
}> {
  const errors: Partial<Record<string, string>> = {}

  const load = async (key: string, url: string): Promise<number | null> => {
    try {
      return await countFrom(url)
    } catch (err) {
      errors[key] = err instanceof Error ? err.message : 'Failed'
      return null
    }
  }

  const [
    providers,
    models,
    deployments,
    agents,
    promptTemplates,
    eventConfigs,
    usagePolicies,
    executionLogs,
    tools,
  ] = await Promise.all([
    load('providers', AI_AGENT_ADMIN_ENDPOINTS.providers({ page: 0, size: 1 })),
    load('models', AI_AGENT_ADMIN_ENDPOINTS.models({ page: 0, size: 1 })),
    load('deployments', AI_AGENT_ADMIN_ENDPOINTS.modelDeployments({ page: 0, size: 1 })),
    load('agents', AI_AGENT_ADMIN_ENDPOINTS.agents({ page: 0, size: 1 })),
    load('promptTemplates', AI_AGENT_ADMIN_ENDPOINTS.promptTemplates({ page: 0, size: 1 })),
    load('eventConfigs', AI_AGENT_ADMIN_ENDPOINTS.eventConfigs({ page: 0, size: 1 })),
    load('usagePolicies', AI_AGENT_ADMIN_ENDPOINTS.usagePolicies({ page: 0, size: 1 })),
    load('executionLogs', AI_AGENT_ADMIN_ENDPOINTS.executionLogs({ page: 0, size: 1 })),
    load('tools', AI_AGENT_ADMIN_ENDPOINTS.tools({ page: 0, size: 1 })),
  ])

  return {
    providers,
    models,
    deployments,
    agents,
    promptTemplates,
    eventConfigs,
    usagePolicies,
    executionLogs,
    tools,
    errors,
  }
}
