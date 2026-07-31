'use client'

import { useMemo } from 'react'
import { usePhaseWatch } from '@/modules/projects/phase'
import { useCapacityOverview } from '@/modules/capacity/presentation/hooks/useCapacityOverview'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import { useWorkspaceActivityFeed } from './useWorkspaceActivityFeed'
import { useWorkspaceMembers } from './useWorkspaceMembers'
import {
  buildAttentionItems,
  buildPortfolioSummary,
  flattenUnassignedTasks,
  sortPortfolioRows,
} from '../domain/rules/portfolio.rules'

export function useWorkspacePortfolio(workspaceId: string | null) {
  const phaseWatch = usePhaseWatch(workspaceId)
  const capacity = useCapacityOverview(workspaceId)
  const activity = useWorkspaceActivityFeed(workspaceId, 0, 12)
  const members = useWorkspaceMembers(workspaceId)

  const summary = useMemo(() => buildPortfolioSummary(phaseWatch.allRows), [phaseWatch.allRows])

  const sortedRows = useMemo(() => sortPortfolioRows(phaseWatch.allRows), [phaseWatch.allRows])

  const attentionItems = useMemo(
    () =>
      buildAttentionItems(phaseWatch.allRows, workspaceId ?? '', {
        overAllocatedCount: Math.max(
          capacity.overview?.overAllocatedResourceCount ?? 0,
          capacity.overAllocations.length
        ),
        capacityHref: workspaceId ? WORKSPACE_ROUTES.capacity(workspaceId) : undefined,
      }),
    [
      phaseWatch.allRows,
      workspaceId,
      capacity.overview?.overAllocatedResourceCount,
      capacity.overAllocations.length,
    ]
  )

  const unassignedTasks = useMemo(
    () => flattenUnassignedTasks(phaseWatch.allRows),
    [phaseWatch.allRows]
  )

  return {
    rows: sortedRows,
    allRows: phaseWatch.allRows,
    summary,
    attentionItems,
    unassignedTasks,
    capacity,
    activity,
    members: members.members,
    membersLoading: members.loading,
    phaseWatchLoading: phaseWatch.loading,
    phaseWatchError: phaseWatch.error,
    refetchPhaseWatch: phaseWatch.refetch,
  }
}
