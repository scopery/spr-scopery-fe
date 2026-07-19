import type { AgentScope } from '../enums/agent.enum'
import { AgentScope as Scope } from '../enums/agent.enum'

/** GLOBAL scope must not retain org/workspace IDs. */
export function sanitizeAgentScopeFields(input: {
  scope: AgentScope | null | undefined
  organizationId?: string | null
  workspaceId?: string | null
}): {
  organizationId: string | null
  workspaceId: string | null
} {
  if (!input.scope || input.scope === Scope.Global) {
    return { organizationId: null, workspaceId: null }
  }
  if (input.scope === Scope.Organization) {
    return {
      organizationId: input.organizationId?.trim() || null,
      workspaceId: null,
    }
  }
  return {
    organizationId: input.organizationId?.trim() || null,
    workspaceId: input.workspaceId?.trim() || null,
  }
}
