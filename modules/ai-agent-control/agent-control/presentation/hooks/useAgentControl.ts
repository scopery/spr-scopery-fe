'use client'

import { useCallback, useEffect, useState } from 'react'
import * as accessApi from '@/modules/permissions/access/api/access.api'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import type {
  AgentControlMetadata,
  AgentControlPreset,
  OrgAgentListItem,
  OrgModelPolicyListItem,
} from '../../domain/model/agent-control-types'
import type { AgentControlFilters } from '../../domain/model/agent-control'
import * as agentControlApi from '../../infrastructure/api/agent-control.api'

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
      const perms = await accessApi.getEffectivePermissions(orgId).catch(() => null)
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
        agentControlApi.getAgentControlMetadata(orgId).catch(() => null),
        agentControlApi.listOrgAgents(orgId, listParams).catch(() => ({ items: [], total: 0 })),
        agentControlApi
          .listOrgModelPolicies(orgId, listParams)
          .catch(() => ({ items: [], total: 0 })),
        hasPermission(perms, PERMISSIONS.AGENT_CONTROL_VIEW)
          ? agentControlApi.listAgentControlPresets(orgId).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ])

      setMetadata(meta)
      setAgents(agentsRes.items ?? [])
      setPolicies(policiesRes.items ?? [])
      setPresets(presetsRes.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent control')
    } finally {
      setLoading(false)
    }
  }, [orgId, filters?.search, filters?.status])

  useEffect(() => {
    void load()
  }, [load])

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
