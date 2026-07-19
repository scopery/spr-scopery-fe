'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as costRolesApi from '../../infrastructure/api/cost-roles.api'
import * as inflationPoliciesApi from '../../infrastructure/api/inflation-policies.api'
import * as memberCostRolesApi from '../../infrastructure/api/member-cost-roles.api'
import type { CostRole, CreateCostRolePayload } from '../../domain/model/cost-role'
import type {
  CreateInflationPolicyPayload,
  InflationPolicy,
} from '../../domain/model/inflation-policy'
import type {
  CreateMemberCostRolePayload,
  MemberCostRole,
} from '../../domain/model/member-cost-role'
import { RateCardScope } from '../../domain/enums/rate-card.enum'

/** Workspace-scoped costing setup: cost roles, inflation policies, and member cost role assignments. */
export function useCostingSetup(workspaceId: string | null) {
  const [costRoles, setCostRoles] = useState<CostRole[]>([])
  const [inflationPolicies, setInflationPolicies] = useState<InflationPolicy[]>([])
  const [memberCostRoles, setMemberCostRoles] = useState<MemberCostRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingCostRole, setCreatingCostRole] = useState(false)
  const [creatingInflationPolicy, setCreatingInflationPolicy] = useState(false)
  const [creatingMemberCostRole, setCreatingMemberCostRole] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [rolesRes, policiesRes, membersRes] = await Promise.all([
        costRolesApi.listCostRoles({ workspaceId, size: 100 }),
        inflationPoliciesApi.listInflationPolicies({ workspaceId, size: 100 }),
        memberCostRolesApi.listMemberCostRoles({ workspaceId, size: 100 }),
      ])
      setCostRoles(rolesRes.items)
      setInflationPolicies(policiesRes.items)
      setMemberCostRoles(membersRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load costing setup')
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createCostRole = useCallback(
    async (payload: Omit<CreateCostRolePayload, 'scope' | 'workspaceId'>) => {
      if (!workspaceId) return
      setCreatingCostRole(true)
      try {
        const created = await costRolesApi.createCostRole({
          ...payload,
          scope: RateCardScope.Workspace,
          workspaceId,
        })
        toast.success('Cost role created')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreatingCostRole(false)
      }
    },
    [workspaceId, load]
  )

  const createInflationPolicy = useCallback(
    async (payload: Omit<CreateInflationPolicyPayload, 'scope' | 'workspaceId'>) => {
      if (!workspaceId) return
      setCreatingInflationPolicy(true)
      try {
        const created = await inflationPoliciesApi.createInflationPolicy({
          ...payload,
          scope: RateCardScope.Workspace,
          workspaceId,
        })
        toast.success('Inflation policy created')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreatingInflationPolicy(false)
      }
    },
    [workspaceId, load]
  )

  const createMemberCostRole = useCallback(
    async (payload: Omit<CreateMemberCostRolePayload, 'workspaceId'>) => {
      if (!workspaceId) return
      setCreatingMemberCostRole(true)
      try {
        const created = await memberCostRolesApi.createMemberCostRole({
          ...payload,
          workspaceId,
        })
        toast.success('Member cost role assigned')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreatingMemberCostRole(false)
      }
    },
    [workspaceId, load]
  )

  const archiveCostRole = useCallback(
    async (roleId: string) => {
      try {
        await costRolesApi.archiveCostRole(roleId)
        toast.success('Cost role archived')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  const activateCostRole = useCallback(
    async (roleId: string) => {
      try {
        await costRolesApi.activateCostRole(roleId)
        toast.success('Cost role activated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  const deactivateCostRole = useCallback(
    async (roleId: string) => {
      try {
        await costRolesApi.deactivateCostRole(roleId)
        toast.success('Cost role deactivated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  const archiveInflationPolicy = useCallback(
    async (policyId: string) => {
      try {
        await inflationPoliciesApi.archiveInflationPolicy(policyId)
        toast.success('Inflation policy archived')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  const activateInflationPolicy = useCallback(
    async (policyId: string) => {
      try {
        await inflationPoliciesApi.activateInflationPolicy(policyId)
        toast.success('Inflation policy activated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  const deactivateInflationPolicy = useCallback(
    async (policyId: string) => {
      try {
        await inflationPoliciesApi.deactivateInflationPolicy(policyId)
        toast.success('Inflation policy deactivated')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  const archiveMemberCostRole = useCallback(
    async (assignmentId: string) => {
      try {
        await memberCostRolesApi.archiveMemberCostRole(assignmentId)
        toast.success('Member assignment archived')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [load]
  )

  return {
    costRoles,
    inflationPolicies,
    memberCostRoles,
    loading,
    error,
    creatingCostRole,
    creatingInflationPolicy,
    creatingMemberCostRole,
    createCostRole,
    createInflationPolicy,
    createMemberCostRole,
    archiveCostRole,
    activateCostRole,
    deactivateCostRole,
    archiveInflationPolicy,
    activateInflationPolicy,
    deactivateInflationPolicy,
    archiveMemberCostRole,
    refetch: load,
  }
}
