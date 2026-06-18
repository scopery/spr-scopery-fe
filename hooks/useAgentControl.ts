'use client'

import { useCallback, useEffect, useState } from 'react'
import * as agentControlService from '@/services/agent-control.service'
import * as accessService from '@/services/access.service'
import { hasPermission, PERMISSIONS } from '@/utils/permissions'
import type {
  AgentControlMetadata,
  AgentControlPreset,
  OrgAgentListItem,
  OrgModelPolicyListItem,
} from '@/types/agent-control'

export interface AgentControlFilters {
  search?: string
  status?: string
}

export function useAgentControl(orgId: string | null, filters?: AgentControlFilters) {
  const [metadata, setMetadata] = useState<AgentControlMetadata | null>(null)
  const [agents, setAgents] = useState<OrgAgentListItem[]>([])
  const [policies, setPolicies] = useState<OrgModelPolicyListItem[]>([])
  const [presets, setPresets] = useState<AgentControlPreset[]>([])
  const [canManage, setCanManage] = useState(false)
  const [canViewPrompts, setCanViewPrompts] = useState(false)
  const [canManagePrompts, setCanManagePrompts] = useState(false)
  const [canViewRuntime, setCanViewRuntime] = useState(false)
  const [canViewUsage, setCanViewUsage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const perms = await accessService.getEffectivePermissions(orgId).catch(() => null)
      setCanManage(hasPermission(perms, PERMISSIONS.AGENT_CONTROL_MANAGE))
      setCanViewPrompts(hasPermission(perms, PERMISSIONS.PROMPT_REGISTRY_VIEW))
      setCanManagePrompts(hasPermission(perms, PERMISSIONS.PROMPT_REGISTRY_MANAGE))
      setCanViewRuntime(hasPermission(perms, PERMISSIONS.AGENT_RUNTIME_VIEW))
      setCanViewUsage(hasPermission(perms, PERMISSIONS.AI_USAGE_VIEW))

      const listParams = {
        status: filters?.status || undefined,
        search: filters?.search?.trim() || undefined,
        include_archived: filters?.status === 'archived' ? true : undefined,
      }

      const [meta, agentsRes, policiesRes, presetsRes] = await Promise.all([
        agentControlService.getAgentControlMetadata(orgId).catch(() => null),
        agentControlService.listOrgAgents(orgId, listParams),
        agentControlService.listOrgModelPolicies(orgId, listParams),
        hasPermission(perms, PERMISSIONS.AGENT_CONTROL_VIEW)
          ? agentControlService.listAgentControlPresets(orgId).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ])

      setMetadata(meta)
      setAgents(agentsRes.items)
      setPolicies(policiesRes.items)
      setPresets(presetsRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent control')
    } finally {
      setLoading(false)
    }
  }, [orgId, filters?.search, filters?.status])

  useEffect(() => { void load() }, [load])

  return {
    metadata,
    agents,
    policies,
    presets,
    canManage,
    canViewPrompts,
    canManagePrompts,
    canViewRuntime,
    canViewUsage,
    loading,
    error,
    refetch: load,
  }
}
