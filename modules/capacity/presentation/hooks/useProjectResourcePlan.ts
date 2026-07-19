'use client'

import { useCallback, useEffect, useState } from 'react'
import * as allocationsApi from '../../infrastructure/api/allocations.api'
import * as projectResourcesApi from '../../infrastructure/api/project-resources.api'
import * as resourcesApi from '../../infrastructure/api/resources.api'
import { LongRunningJobStatus } from '@/shared/ui'
import type { ProjectResourceAllocation } from '../../domain/model/project-allocation'
import type {
  AssignmentConflict,
  ProjectAllocationSummary,
  ResourceRiskFlag,
} from '../../domain/model/project-resource-plan'
import type { ResourceProfile } from '../../domain/model/resource-profile'

export type ProjectResourcePlanTab =
  | 'team'
  | 'allocations'
  | 'forecast'
  | 'conflicts'
  | 'cost'

export function useProjectResourcePlan(
  workspaceId: string | null,
  projectId: string | null
) {
  const [tab, setTab] = useState<ProjectResourcePlanTab>('team')
  const [allocations, setAllocations] = useState<ProjectResourceAllocation[]>([])
  const [summary, setSummary] = useState<ProjectAllocationSummary | null>(null)
  const [resources, setResources] = useState<ResourceProfile[]>([])
  const [risks, setRisks] = useState<ResourceRiskFlag[]>([])
  const [conflicts, setConflicts] = useState<AssignmentConflict[]>([])
  const [costInputs, setCostInputs] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<typeof LongRunningJobStatus.Idle | typeof LongRunningJobStatus.Running | typeof LongRunningJobStatus.Completed | typeof LongRunningJobStatus.Failed>(LongRunningJobStatus.Idle)
  const [jobMessage, setJobMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const [allocRes, sum, profiles, riskList, conflictList] = await Promise.all([
        allocationsApi.listProjectAllocations({
          workspaceId,
          projectId,
          page: 0,
          size: 200,
        }),
        projectResourcesApi.getProjectAllocationSummary(projectId).catch(() => null),
        resourcesApi.listResourceProfiles(workspaceId),
        projectResourcesApi.listRiskFlags(projectId).catch(() => []),
        projectResourcesApi.listAssignmentConflicts(projectId).catch(() => []),
      ])
      setAllocations(allocRes.items)
      setSummary(sum)
      setResources(profiles)
      setRisks(riskList)
      setConflicts(conflictList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project resources')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const runRebuild = useCallback(
    async (kind: 'forecast' | 'capacity' | 'cost') => {
      if (!projectId) return
      setJobStatus(LongRunningJobStatus.Running)
      setJobMessage(
        kind === 'forecast'
          ? 'Rebuilding effort forecast…'
          : kind === 'capacity'
            ? 'Rebuilding capacity summary…'
            : 'Rebuilding cost inputs…'
      )
      try {
        if (kind === 'forecast') await projectResourcesApi.rebuildEffortForecast(projectId)
        else if (kind === 'capacity') await projectResourcesApi.rebuildCapacitySummary(projectId)
        else await projectResourcesApi.rebuildCostInputs(projectId, false)
        setJobStatus(LongRunningJobStatus.Completed)
        setJobMessage('Rebuild completed')
        await load()
      } catch (err) {
        setJobStatus(LongRunningJobStatus.Failed)
        setJobMessage(err instanceof Error ? err.message : 'Rebuild failed')
      }
    },
    [projectId, load]
  )

  const loadCostInputs = useCallback(async () => {
    if (!projectId) return
    const data = await projectResourcesApi.getCostInputs(projectId, false)
    setCostInputs(data)
  }, [projectId])

  const acknowledgeConflict = useCallback(
    async (conflictId: string) => {
      if (!projectId) return
      await projectResourcesApi.acknowledgeConflict(projectId, conflictId)
      await load()
    },
    [projectId, load]
  )

  const recalculateConflicts = useCallback(async () => {
    if (!projectId) return
    await projectResourcesApi.recalculateConflicts(projectId)
    await load()
  }, [projectId, load])

  const mitigateRisk = useCallback(
    async (riskId: string) => {
      if (!projectId) return
      await projectResourcesApi.mitigateRiskFlag(projectId, riskId)
      await load()
    },
    [projectId, load]
  )

  const closeRisk = useCallback(
    async (riskId: string) => {
      if (!projectId) return
      await projectResourcesApi.closeRiskFlag(projectId, riskId)
      await load()
    },
    [projectId, load]
  )

  const resourceLabel = useCallback(
    (memberId: string) => {
      const r = resources.find((x) => x.linkedWorkspaceMemberId === memberId)
      return r?.displayName ?? memberId.slice(0, 8)
    },
    [resources]
  )

  return {
    tab,
    setTab,
    allocations,
    summary,
    resources,
    risks,
    conflicts,
    costInputs,
    loading,
    error,
    jobStatus,
    jobMessage,
    refetch: load,
    runRebuild,
    loadCostInputs,
    acknowledgeConflict,
    recalculateConflicts,
    mitigateRisk,
    closeRisk,
    resourceLabel,
  }
}
